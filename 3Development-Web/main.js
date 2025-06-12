import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkRenderWindow from '@kitware/vtk.js/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from '@kitware/vtk.js/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from '@kitware/vtk.js/Rendering/Core/Renderer';
import vtkOpenGLRenderWindow from '@kitware/vtk.js/Rendering/OpenGL/RenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';
import vtkCellPicker from '@kitware/vtk.js/Rendering/Core/CellPicker';
import vtkInteractorStyleTrackballCamera from '@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballCamera';
import vtkLineSource from '@kitware/vtk.js/Filters/Sources/LineSource';

//npm run dev

let currentShatt = 0;

// x y z = comprimento, altura, largura

// Cria uma grade de marcação para os eixos x, y e z
function CreateXYZBasicGrid(renderer) {
  const gridSize = 10; // Tamanho da grade
  const radius = 0.15; // Raio das bolinhas
  const spacing = 2; // Espaçamento entre os marcadores
  for (let x = -gridSize; x <= gridSize; x++) {
    for (let y = -gridSize; y <= gridSize; y++) {
      for (let z = -gridSize; z <= gridSize; z++) {
        if ((x === 0 && y === 0) || (x === 0 && z === 0) || (y === 0 && z === 0)) {
          if (x > 0 || y > 0 || z > 0) { // Cria uma linha se valores positivos
            const lineSource = vtkLineSource.newInstance({
              point1: [0, 0, 0],
              point2: [x * spacing, y * spacing, z * spacing],
            });

            const lineMapper = vtkMapper.newInstance();
            lineMapper.setInputConnection(lineSource.getOutputPort());

            const lineActor = vtkActor.newInstance();
            lineActor.setMapper(lineMapper);

            if (x > 0 && y === 0 && z === 0) {
              lineActor.getProperty().setColor(1, 0, 0); // Vermelho para o eixo X
              lineActor.getProperty().setLineWidth(3); // Aumenta a espessura da linha
            } else if (x === 0 && y > 0 && z === 0) {
              lineActor.getProperty().setColor(0, 1, 0); // Verde para o eixo Y
              lineActor.getProperty().setLineWidth(3); // Aumenta a espessura da linha
            } else if (x === 0 && y === 0 && z > 0) {
              lineActor.getProperty().setColor(0, 0, 1); // Azul para o eixo Z
              lineActor.getProperty().setLineWidth(3); // Aumenta a espessura da linha
            }

            renderer.addActor(lineActor);
          } else { // Cria uma bolinha para valores negativos
            const sphereSource = vtkSphereSource.newInstance({
              radius: radius,
              thetaResolution: 32,
              phiResolution: 32,
            });

            const sphereMapper = vtkMapper.newInstance();
            sphereMapper.setInputConnection(sphereSource.getOutputPort());

            const sphereActor = vtkActor.newInstance();
            sphereActor.setMapper(sphereMapper);

            // Define cores diferentes para os eixos
            if (x < 0 && y === 0 && z === 0) {
              sphereActor.getProperty().setColor(1, 0, 0); // Vermelho para o eixo X
            } else if (x === 0 && y < 0 && z === 0) {
              sphereActor.getProperty().setColor(0, 1, 0); // Verde para o eixo Y
            } else if (x === 0 && y === 0 && z < 0) {
              sphereActor.getProperty().setColor(0, 0, 1); // Azul para o eixo Z
            }

            // Define a posição da bolinha
            sphereActor.setPosition(x * spacing, y * spacing, z * spacing);
            renderer.addActor(sphereActor);
          }
        }
      }
    }
  }
}

function InitializeRenderWindowAndCamera(renderWindow, renderer, openGLRenderWindow, interactor, container, camera) {
  renderWindow.addRenderer(renderer);
  renderWindow.addView(openGLRenderWindow);

  openGLRenderWindow.setContainer(container);
  // Ajusta o tamanho do renderizador para ocupar toda a tela sem scrollbars
  const resizeRenderer = () => {
    const { innerWidth, innerHeight } = window;
    container.style.width = `${innerWidth}px`;
    container.style.height = `${innerHeight}px`;
    openGLRenderWindow.setSize(innerWidth, innerHeight);
    renderWindow.render();
  };

  // Configura o evento de redimensionamento da janela
  window.addEventListener('resize', resizeRenderer);
  resizeRenderer();

  interactor.setView(openGLRenderWindow);
  interactor.initialize();
  interactor.bindEvents(container);
  interactor.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance());

  container.style.margin = '0';
  container.style.padding = '0';
  container.style.overflow = 'hidden';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';

  camera.setPosition(0, 0, 1); 
  camera.setFocalPoint(0.5, -0.5, 0.5);
  camera.setViewUp(0, 1, 0);
  renderWindow.render();
}

function CreateLine(renderer) {
  const lineSource = vtkLineSource.newInstance({
    point1: [0, 0, 0], 
    point2: [10, 5, 10],
  });

  const lineMapper = vtkMapper.newInstance();
  lineMapper.setInputConnection(lineSource.getOutputPort());

  const lineActor = vtkActor.newInstance();
  lineActor.setMapper(lineMapper);
  lineActor.getProperty().setColor(1, 1, 0);
  lineActor.getProperty().setLineWidth(2);

  renderer.addActor(lineActor);
}

function CreateClickBall(markerSource, markerMapper, markerActor, renderer, renderWindow, interactor, backButton) {
  markerMapper.setInputConnection(markerSource.getOutputPort());
  markerActor.setMapper(markerMapper);
  markerActor.getProperty().setColor(1, 1, 1);
  
  // Posição do marcador
  markerActor.setPosition(0, 0, 0);
  renderer.addActor(markerActor);
  
  renderer.resetCamera();
  renderWindow.render();

  // Interação de clique
  const picker = vtkCellPicker.newInstance();
  picker.setTolerance(0.01);
  
  interactor.onLeftButtonPress((callData) => {
    const pos = callData.position;
    picker.pick([pos.x, pos.y, 0], renderer, renderWindow);
  
    const pickedActor = picker.getActors()[0];
    if (pickedActor === markerActor) {
      backButton.style.display = 'none';
      document.getElementById('shatt-modal').style.display = 'flex';
    }
  });
}

function ModalBaseDataConfig(modal, modalContent, submitFstButton, backButtonBase, inputH, inputB, inputL, inputY, inputQTTShatt, structureImage, structureId) {
  
  modalContent.innerHTML = '';
  
  modal.id = 'base-modal';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  modal.style.display = 'flex';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';
  modal.style.zIndex = '1000';

  modalContent.style.backgroundColor = 'white';
  modalContent.style.padding = '20px';
  modalContent.style.borderRadius = '8px';
  modalContent.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
  modalContent.style.display = 'flex';
  modalContent.style.flexDirection = 'row';
  modalContent.style.width = '80%';
  modalContent.style.height = '80%';

  // Left side for inputs
  const inputContainer = document.createElement('div');
  inputContainer.style.flex = '1';
  inputContainer.style.display = 'flex';
  inputContainer.style.flexDirection = 'column';
  inputContainer.style.justifyContent = 'center';
  inputContainer.style.paddingRight = '20px';

  const instructions = document.createElement('p');
  instructions.textContent = 'Por favor, preencha os dados a seguir conforme a imagem da Direita:';
  instructions.style.marginBottom = '20px';
  inputContainer.appendChild(instructions);

  inputH.type = 'number';
  inputH.placeholder = 'H';
  inputH.style.display = 'block';
  inputH.style.marginBottom = '10px';
  inputContainer.appendChild(inputH);

  inputB.type = 'number';
  inputB.placeholder = 'B';
  inputB.style.display = 'block';
  inputB.style.marginBottom = '10px';
  inputContainer.appendChild(inputB);

  inputL.type = 'number';
  inputL.placeholder = 'L';
  inputL.style.display = 'block';
  inputL.style.marginBottom = '10px';
  inputContainer.appendChild(inputL);
  
  inputQTTShatt.type = 'number';
  inputQTTShatt.placeholder = 'QTT Shatt';
  inputQTTShatt.style.display = 'block';
  inputQTTShatt.style.marginBottom = '10px';
  inputContainer.appendChild(inputQTTShatt);

  // Adiciona os inputs específicos para cada estrutura
  switch (structureId) {
    case 1:
      const inputJJ = document.createElement('input');
      inputJJ.type = 'number';
      inputJJ.placeholder = 'JJ';
      inputJJ.style.display = 'block';
      inputJJ.style.marginBottom = '10px';
      inputContainer.appendChild(inputJJ);

      inputY.type = 'number';
      inputY.placeholder = 'Y';
      inputY.style.display = 'block';
      inputY.style.marginBottom = '10px';
      inputContainer.appendChild(inputY);
      break;

    case 2:
      inputL.type = 'number';
      inputL.placeholder = 'L';
      inputL.style.display = 'block';
      inputL.style.marginBottom = '10px';
      inputContainer.appendChild(inputL);
      break;

    case 3:
      inputH.type = 'number';
      inputH.placeholder = 'H';
      inputH.style.display = 'block';
      inputH.style.marginBottom = '10px';
      inputContainer.appendChild(inputH);

      inputB.type = 'number';
      inputB.placeholder = 'B';
      inputB.style.display = 'block';
      inputB.style.marginBottom = '10px';
      inputContainer.appendChild(inputB);
      break;

    default:
      console.warn('Invalid structureId');
      break;
  }

  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'space-between';
  buttonContainer.style.marginTop = '10px';

  backButtonBase.textContent = 'Back';
  backButtonBase.style.margin = '0';

  submitFstButton.textContent = 'Submit Base';
  submitFstButton.style.margin = '0';

  buttonContainer.appendChild(backButtonBase);
  buttonContainer.appendChild(submitFstButton);
  inputContainer.appendChild(buttonContainer);

  // Right side for the image
  const imageContainer = document.createElement('div');
  imageContainer.style.flex = '1';
  imageContainer.style.display = 'flex';
  imageContainer.style.justifyContent = 'center';
  imageContainer.style.alignItems = 'center';
  imageContainer.style.paddingLeft = '20px';

  const image = document.createElement('img');
  image.src = structureImage;
  image.alt = 'Structure Image';
  image.style.maxWidth = '100%';
  image.style.maxHeight = '100%';
  imageContainer.appendChild(image);

  // Append both containers to modalContent
  modalContent.appendChild(inputContainer);
  modalContent.appendChild(imageContainer);

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

}

function ModalShattConfig(newModal, newModalContent, backButton, submitScndButton, buttonContainer, hShattInput, typeShattInput) {
  newModal.id = 'shatt-modal';
  newModal.style.position = 'fixed';
  newModal.style.top = '0';
  newModal.style.left = '0';
  newModal.style.width = '100%';
  newModal.style.height = '100%';
  newModal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  newModal.style.display = 'flex';
  newModal.style.justifyContent = 'center';
  newModal.style.alignItems = 'center';
  newModal.style.zIndex = '1000';

  newModalContent.style.backgroundColor = 'white';
  newModalContent.style.padding = '20px';
  newModalContent.style.borderRadius = '8px';
  newModalContent.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
  newModalContent.textContent = `Shatt ${currentShatt}`;
  
  typeShattInput.type = 'text';
  typeShattInput.placeholder = 'TypeShatt (X, N, W)';
  typeShattInput.style.display = 'block';
  typeShattInput.style.marginBottom = '10px';
  newModalContent.appendChild(typeShattInput);
  
  hShattInput.type = 'number';
  hShattInput.placeholder = 'HShatt';
  hShattInput.style.display = 'block';
  hShattInput.style.marginBottom = '10px';
  newModalContent.appendChild(hShattInput);
  
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'space-between';
  buttonContainer.style.marginTop = '10px';
  
  backButton.textContent = 'Back';
  backButton.style.margin = '0';
  
  
  submitScndButton.textContent = 'Submit Shatt';
  submitScndButton.style.margin = '0'; 
  
  // Adiciona os botões ao contêiner
  buttonContainer.appendChild(backButton);
  buttonContainer.appendChild(submitScndButton);
  
  // Adiciona o contêiner ao modal
  newModalContent.appendChild(buttonContainer);
  newModal.appendChild(newModalContent);
  document.body.appendChild(newModal);
}
    
function ModalTypeStructure(modalTypeStructure, modalTypeStructureContent, confirmButton, modal, modalContent, submitFstButton, backButtonBase, inputH, inputB, inputL, inputY, inputQTTShatt, backButton, submitScndButton, newModal, newModalContent) {
  modalTypeStructure.id = 'structure-modal';
  modalTypeStructure.style.position = 'fixed';
  modalTypeStructure.style.top = '0';
  modalTypeStructure.style.left = '0';
  modalTypeStructure.style.width = '100%';
  modalTypeStructure.style.height = '100%';
  modalTypeStructure.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  modalTypeStructure.style.display = 'flex';
  modalTypeStructure.style.justifyContent = 'center';
  modalTypeStructure.style.alignItems = 'center';
  modalTypeStructure.style.zIndex = '1000';

  modalTypeStructureContent.style.backgroundColor = 'white';
  modalTypeStructureContent.style.padding = '20px';
  modalTypeStructureContent.style.borderRadius = '8px';
  modalTypeStructureContent.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
  modalTypeStructureContent.style.display = 'flex';
  modalTypeStructureContent.style.flexWrap = 'wrap';
  modalTypeStructureContent.style.justifyContent = 'center';
  modalTypeStructureContent.style.overflowY = 'auto';
  modalTypeStructureContent.style.maxHeight = '80%';
  modalTypeStructureContent.style.width = '80%';

  const title = document.createElement('h2');
  title.textContent = 'Project Structures';
  title.style.marginBottom = '20px';
  title.style.width = '100%';
  title.style.textAlign = 'center';
  modalTypeStructureContent.appendChild(title);

  const projectStructures = [
    { id: 1, name: 'Structure 1', path: 'ProjectStructuresPhotos/1/1.png', imgStructure: 'ProjectStructuresPhotos/1/Structure.png' },
    { id: 2, name: 'Structure 2', path: 'ProjectStructuresPhotos/2/2.png', imgStructure: 'ProjectStructuresPhotos/2/Structure.png' },
    { id: 3, name: 'Structure 3', path: 'ProjectStructuresPhotos/3/3.png', imgStructure: 'ProjectStructuresPhotos/3/Structure.png' },
    { id: 4, name: 'Structure 4', path: 'ProjectStructuresPhotos/4/4.png', imgStructure: 'ProjectStructuresPhotos/4/Structure.png' },
    { id: 5, name: 'Structure 5', path: 'ProjectStructuresPhotos/5/5.png', imgStructure: 'ProjectStructuresPhotos/5/Structure.png' },
    { id: 6, name: 'Structure 6', path: 'ProjectStructuresPhotos/6/6.png', imgStructure: 'ProjectStructuresPhotos/6/Structure.png' },
    { id: 7, name: 'Structure 7', path: 'ProjectStructuresPhotos/7/7.png', imgStructure: 'ProjectStructuresPhotos/7/Structure.png' },
  ];

  projectStructures.forEach((structure) => {
    const itemContainer = document.createElement('div');
    itemContainer.style.margin = '15px';
    itemContainer.style.textAlign = 'center';
    itemContainer.style.flex = '1 1 300px';
    itemContainer.style.maxWidth = '300px';

    const itemTitle = document.createElement('h3');
    itemTitle.textContent = structure.name;
    itemTitle.style.marginBottom = '10px';
    itemContainer.appendChild(itemTitle);

    const itemImage = document.createElement('img');
    itemImage.src = structure.path;
    itemImage.alt = structure.name;
    itemImage.style.width = '100%';
    itemImage.style.cursor = 'pointer';

    // Evento de clique para abrir o modal de dados base
    itemImage.addEventListener('click', () => {
      modalTypeStructure.style.display = 'none'; 
      modal.style.display = 'flex'; 
      ModalBaseDataConfig(modal, modalContent, submitFstButton, backButtonBase, inputH, inputB, inputL, inputY, inputQTTShatt, structure.imgStructure, structure.id);
    });

    itemContainer.appendChild(itemImage);
    modalTypeStructureContent.appendChild(itemContainer);
  });

  // Adiciona o botão Confirm
  confirmButton.textContent = 'Confirm';
  confirmButton.style.marginTop = '20px';
  confirmButton.style.padding = '10px 20px';
  confirmButton.style.border = 'none';
  confirmButton.style.borderRadius = '5px';
  confirmButton.style.backgroundColor = '#007BFF';
  confirmButton.style.color = 'white';
  confirmButton.style.cursor = 'pointer';
  
  modalTypeStructure.appendChild(modalTypeStructureContent);
  document.body.appendChild(modalTypeStructure);
}

function Restart() {
  const restartButton = document.createElement('button');
  restartButton.textContent = 'Restart';
  restartButton.style.position = 'fixed';
  restartButton.style.bottom = '20px';
  restartButton.style.left = '20px';
  restartButton.style.padding = '10px 20px';
  restartButton.style.backgroundColor = '#FFFFFF';
  restartButton.style.color = 'black';
  restartButton.style.border = 'none';
  restartButton.style.borderRadius = '5px';
  restartButton.style.cursor = 'pointer';

  restartButton.addEventListener('click', () => {
    location.reload();
  });

  document.body.appendChild(restartButton);
}

function Finish(inputH, inputB, inputL, inputY, inputQTTShatt, typeShattInput, hShattInput) {
  const finishButton = document.createElement('button');
  finishButton.textContent = 'Finish';
  finishButton.style.position = 'fixed';
  finishButton.style.bottom = '20px';
  finishButton.style.right = '20px'; // Move para o canto inferior direito
  finishButton.style.padding = '10px 20px';
  finishButton.style.backgroundColor = '#28a745';
  finishButton.style.color = 'white';
  finishButton.style.border = 'none';
  finishButton.style.borderRadius = '5px';
  finishButton.style.cursor = 'pointer';

  finishButton.addEventListener('click', () => {
    // Coleta os valores dos inputs
    const data = {
      inputH: inputH.value,
      inputB: inputB.value,
      inputL: inputL.value,
      inputY: inputY.value,
      inputQTTShatt: inputQTTShatt.value,
      typeShatt: typeShattInput.value,
      hShatt: hShattInput.value,
    };

    // Converte os dados para JSON
    const jsonData = JSON.stringify(data, null, 2);

    // Exibe o JSON no console (ou salve em um arquivo, se necessário)
    console.log('Dados salvos:', jsonData);

    // Exibe o JSON em um modal ou alerta
    alert(`Dados salvos:\n${jsonData}`);
    location.reload();
  });

  document.body.appendChild(finishButton);
}

function ShowStartScreen(onStartCallback) {
  const startScreen = document.createElement('div');
  startScreen.style.position = 'fixed';
  startScreen.style.top = '0';
  startScreen.style.left = '0';
  startScreen.style.width = '100%';
  startScreen.style.height = '100%';
  startScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  startScreen.style.display = 'flex';
  startScreen.style.flexDirection = 'column';
  startScreen.style.justifyContent = 'center';
  startScreen.style.alignItems = 'center';
  startScreen.style.zIndex = '1000';

  container.style.width = '100%';
  container.style.height = '100%';
  container.style.margin = 'auto';
  container.style.position = 'relative';

  const title = document.createElement('h1');
  title.textContent = '3Design';
  title.style.color = 'white';
  title.style.marginBottom = '20px';
  title.style.fontSize = '2rem';
  title.style.textAlign = 'center';
  startScreen.appendChild(title);

  const startButton = document.createElement('button');
  startButton.textContent = 'New Project';
  startButton.style.padding = '10px 20px';
  startButton.style.fontSize = '1.2rem';
  startButton.style.color = 'white';
  startButton.style.backgroundColor = '#007BFF';
  startButton.style.border = 'none';
  startButton.style.borderRadius = '5px';
  startButton.style.cursor = 'pointer';

  startButton.addEventListener('click', () => {
    document.body.removeChild(startScreen); // Remove a tela inicial
    onStartCallback(); // Chama a função principal
  });

  startScreen.appendChild(startButton);

  // Adiciona a tela inicial ao body
  document.body.appendChild(startScreen);
}

function Main() {
  // Modal de Estrutura do projeto
  const modalTypeStructure = document.createElement('div');
  const modalTypeStructureContent = document.createElement('div');
  
  // Modal para os dados base
  const modal = document.createElement('div');
  const modalContent = document.createElement('div');
  
  // Modal para os dados de shatt
  const newModal = document.createElement('div');
  const newModalContent = document.createElement('div');
  
  // Inputs de leitura dos dados base do projeto
  const inputH = document.createElement('input');
  const inputB = document.createElement('input');
  const inputL = document.createElement('input');
  const inputY = document.createElement('input');
  const inputQTTShatt = document.createElement('input');
  
  // Inputs de leitura dos dados de shatt
  const typeShattInput = document.createElement('input');
  const hShattInput = document.createElement('input');
  
  // Buttons
  const buttonContainer = document.createElement('div');
  const submitFstButton = document.createElement('button');
  const submitScndButton = document.createElement('button');
  const backButtonBase = document.createElement('button');
  const backButton = document.createElement('button');
  const confirmButton = document.createElement('button');
  
  // Ação do botão de "voltar" ao modal de dados base
  backButton.addEventListener('click', () => {
    newModal.style.display = 'none';
    document.getElementById('base-modal').style.display = 'flex';
  });

  // Ação do botão de "fechar" o modal de dados base
  backButtonBase.addEventListener('click', () => {
    modal.style.display = 'none';
    document.getElementById('structure-modal').style.display = 'flex';
  });
  
  // Ação de "Submit" do modal de dados base
  submitFstButton.addEventListener('click', () => {
    modal.style.display = 'none';
    ModalShattConfig(newModal, newModalContent, backButton, submitScndButton, buttonContainer, hShattInput, typeShattInput);
  });

  // Ação de "Submit" do modal de dados de shatt
  submitScndButton.addEventListener('click', () => {
    currentShatt++;
    ModalShattConfig(newModal, newModalContent, backButton, submitScndButton, buttonContainer, hShattInput, typeShattInput);
    const typeShattValue = typeShattInput.value.toUpperCase();
    let inputCount;
    if (typeShattValue === 'X') {
      inputCount = 2;
    } else if (typeShattValue === 'N') {
      inputCount = 1;
    } else if (typeShattValue === 'W') {
      inputCount = 4;
    } else {
      alert('TypeShatt deve ser um valor válido (X, N, W).');
      return;
    }
    newModal.style.display = 'none';
  });

  // Ação do botão de "confirmar" o modal de estruturas do projeto
  confirmButton.addEventListener('click', () => {
    modalTypeStructure.style.display = 'none';
    modal.style.display = 'flex';
    ModalBaseDataConfig(modal, modalContent, submitFstButton, backButtonBase, inputH, inputB, inputL, inputY, inputQTTShatt, structure, id);
  });

  ModalTypeStructure(modalTypeStructure, modalTypeStructureContent, confirmButton, modal, modalContent, submitFstButton, backButtonBase, inputH, inputB, inputL, inputY, inputQTTShatt, backButton, submitScndButton, newModal, newModalContent);
  
  // Cria o renderizador e a janela de renderização
  const renderWindow = vtkRenderWindow.newInstance();
  const renderer = vtkRenderer.newInstance();  
  const openGLRenderWindow = vtkOpenGLRenderWindow.newInstance();
  const container = document.getElementById('container');
  const interactor = vtkRenderWindowInteractor.newInstance();
  const camera = renderer.getActiveCamera();
  const markerMapper = vtkMapper.newInstance();
  const markerActor = vtkActor.newInstance();

  InitializeRenderWindowAndCamera(renderWindow, renderer, openGLRenderWindow, interactor, container, camera);
  
  CreateXYZBasicGrid(renderer);

  CreateLine(renderer); // Teste

  const markerSource = vtkSphereSource.newInstance({
    radius: 0.5,
    thetaResolution: 64,
    phiResolution: 64,
  });
  
  CreateClickBall(markerSource, markerMapper, markerActor, renderer, renderWindow, interactor, backButton);
  Restart();
  Finish(inputH, inputB, inputL, inputY, inputQTTShatt, typeShattInput, hShattInput);
}

ShowStartScreen(Main);