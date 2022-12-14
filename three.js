import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js";

import { FBXLoader } from "https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.118.1/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js";

startButton.onclick = function () {
  startGame = !startGame;
  controllable = true;
  startButton.style.display = "none";
};

class BasicCharacterControllerProxy {
  constructor(animations) {
    this._animations = animations;
  }

  get animations() {
    return this._animations;
  }
}

class BasicCharacterController {
  constructor(params) {
    this._Init(params);
  }

  _Init(params) {
    this._params = params;
    this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
    this._acceleration = new THREE.Vector3(1, 0.25, 50.0);
    this._velocity = new THREE.Vector3(0, 0, 0);
    this._position = new THREE.Vector3();

    this._animations = {};
    this._input = new BasicCharacterControllerInput();
    this._stateMachine = new CharacterFSM(
      new BasicCharacterControllerProxy(this._animations)
    );
    this._LoadModels();
    this._LoadBoundaries();
  }

  _LoadModels() {
    const loader = new FBXLoader();
    loader.setPath("./world/models/my-avatar/");
    loader.load("brockAvatarInc.fbx", (fbx) => {
      fbx.scale.setScalar(0.1);
      fbx.traverse((i) => {
        if (i.isMesh) (i.material.shininess = 0), (i.material.roughness = 1);
      });

      this._target = fbx;
      this._params.scene.add(this._target);

      this._mixer = new THREE.AnimationMixer(this._target);
      this._mixer._root.name = "player";
      player = this._mixer._root;
      player.rotation.y += 1.6;
      player.position.x += 7;
      this._manager = new THREE.LoadingManager();
      this._manager.onLoad = () => {
        this._stateMachine.SetState("idle");
      };
      const _OnLoad = (animName, anim) => {
        const clip = anim.animations[0];
        const action = this._mixer.clipAction(clip);

        this._animations[animName] = {
          clip: clip,
          action: action,
        };
      };

      const loader = new FBXLoader(this._manager);
      loader.setPath("./world/models/animations/");
      loader.load("walking.fbx", (a) => {
        _OnLoad("walk", a);
      });
      loader.load("running.fbx", (a) => {
        _OnLoad("run", a);
      });
      loader.load("idle.fbx", (a) => {
        _OnLoad("idle", a);
      });
      loader.load("swing-dancing.fbx", (a) => {
        _OnLoad("dance", a);
      });
      loader.load("waving.fbx", (a) => {
        _OnLoad("wave", a);
      });
      loader.load("fighting.fbx", (a) => {
        _OnLoad("fight", a);
      });
    });

    const roomLoader = new GLTFLoader();
    roomLoader.load("./world/models/objects/room/scene.gltf", (gltf) => {
      gltf.scene.scale.set(20, 20, 20);
      gltf.scene.receiveShadow = true;

      this._params.scene.add(gltf.scene);
    });

    const arcadeMachineLoader = new GLTFLoader();
    arcadeMachineLoader.load(
      "./world/models/objects/arcade-machine/scene.gltf",
      (gltf) => {
        gltf.scene.scale.set(12, 12, 12);
        gltf.scene.receiveShadow = true;
        gltf.scene.rotation.y += -1.6;
        gltf.scene.position.setX(101);

        this._params.scene.add(gltf.scene);
      }
    );
  }

  _LoadBoundaries() {
    //player BOUNDING box
    const playerbox = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1, 1),
      new THREE.MeshPhongMaterial({
        color: 0xffff00,
        opacity: 0,
        transparent: true,
      })
    );
    playerbox.scale.set(10, 10, 10);
    playerbox.position.set(1, 1, 1);

    playerBoundingBox = new THREE.Box3(
      new THREE.Vector3(),
      new THREE.Vector3()
    );
    playerBoundingBox.setFromObject(playerbox);
    playerBox = playerbox;
    this._params.scene.add(playerbox);

    //player PROXIMITY box
    const playerProximitybox = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1, 1),
      new THREE.MeshPhongMaterial({
        color: 0x0000ff,
        opacity: 0,
        transparent: true,
      })
    );
    playerProximitybox.scale.set(15, 15, 15);
    playerProximitybox.position.set(1, 1, 1);

    playerProximityBoundingBox = new THREE.Box3(
      new THREE.Vector3(),
      new THREE.Vector3()
    );

    playerProximityBoundingBox.setFromObject(playerProximitybox);
    playerProximityBox = playerProximitybox;
    this._params.scene.add(playerProximitybox);

    const arcadeMachinebox = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1, 1),
      new THREE.MeshPhongMaterial({ color: 0x0000ff })
    );
    arcadeMachinebox.scale.set(10, 10, 10);
    arcadeMachinebox.position.set(101, 0, 0);
    arcadeMachineBoundingBox = new THREE.Box3(
      new THREE.Vector3(),
      new THREE.Vector3()
    );
    arcadeMachineBoundingBox.setFromObject(arcadeMachinebox);
    arcadeMachineBox = arcadeMachinebox;
    this._params.scene.add(arcadeMachinebox);
  }

  get Position() {
    return this._position;
  }

  get Rotation() {
    if (!this._target) {
      return new THREE.Quaternion();
    }
    return this._target.quaternion;
  }

  Update(timeInSeconds) {
    if (!this._stateMachine._currentState) {
      return;
    }

    victoryPointsContainer.innerHTML = `Victory Points: ${parseInt(
      victoryPoints
    )}`;

    this._stateMachine.Update(timeInSeconds, this._input);

    const velocity = this._velocity;
    const frameDecceleration = new THREE.Vector3(
      velocity.x * this._decceleration.x,
      velocity.y * this._decceleration.y,
      velocity.z * this._decceleration.z
    );
    frameDecceleration.multiplyScalar(timeInSeconds);
    frameDecceleration.z =
      Math.sign(frameDecceleration.z) *
      Math.min(Math.abs(frameDecceleration.z), Math.abs(velocity.z));

    velocity.add(frameDecceleration);

    const controlObject = this._target;
    const _Q = new THREE.Quaternion();
    const _A = new THREE.Vector3();
    const _R = controlObject.quaternion.clone();

    playerBoundingBox
      .copy(playerBox.geometry.boundingBox)
      .applyMatrix4(playerBox.matrixWorld);

    playerProximityBoundingBox
      .copy(playerProximityBox.geometry.boundingBox)
      .applyMatrix4(playerProximityBox.matrixWorld);

    function updatePlayerBoundary() {
      playerBox.position.x = player.position.x;
      playerBox.position.y = player.position.y + 5;
      playerBox.position.z = player.position.z;

      playerProximityBox.position.x = player.position.x;
      playerProximityBox.position.y = player.position.y + 5;
      playerProximityBox.position.z = player.position.z;
    }

    const acc = this._acceleration.clone();
    if (this._input._keys.shift) {
      acc.multiplyScalar(4.0);
    }

    if (this._stateMachine._currentState.Name == "dance") {
      acc.multiplyScalar(0.0);
    }

    if (this._stateMachine._currentState.Name == "wave") {
      acc.multiplyScalar(0.0);
    }

    if (this._stateMachine._currentState.Name == "fight") {
      acc.multiplyScalar(0.0);
    }

    if (
      this._input._keys.space &&
      playerProximityBoundingBox.intersectsBox(arcadeMachineBoundingBox) &&
      controllable
    ) {
      this._input._keys.space = false;
      startFightingGame();
    }

    if (
      this._input._keys.forward &&
      !playerBoundingBox.intersectsBox(arcadeMachineBoundingBox)
    ) {
      velocity.z += acc.z * timeInSeconds;
      updatePlayerBoundary();
    } else if (playerBoundingBox.intersectsBox(arcadeMachineBoundingBox)) {
      player.position.x = arcadeMachineBox.position.x - 11;
    }

    if (this._input._keys.backward) {
      velocity.z -= acc.z * timeInSeconds;
      updatePlayerBoundary();
    }

    if (this._input._keys.left) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(
        _A,
        4.0 * Math.PI * timeInSeconds * this._acceleration.y
      );
      _R.multiply(_Q);
      updatePlayerBoundary();
    }

    if (this._input._keys.right) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(
        _A,
        4.0 * -Math.PI * timeInSeconds * this._acceleration.y
      );
      _R.multiply(_Q);
      updatePlayerBoundary();
    }

    controlObject.quaternion.copy(_R);

    const oldPosition = new THREE.Vector3();
    oldPosition.copy(controlObject.position);

    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(controlObject.quaternion);
    forward.normalize();

    const sideways = new THREE.Vector3(1, 0, 0);
    sideways.applyQuaternion(controlObject.quaternion);
    sideways.normalize();

    sideways.multiplyScalar(velocity.x * timeInSeconds);
    forward.multiplyScalar(velocity.z * timeInSeconds);

    controlObject.position.add(forward);
    controlObject.position.add(sideways);

    this._position.copy(controlObject.position);

    if (this._mixer) {
      this._mixer.update(timeInSeconds);
    }
  }
}

class BasicCharacterControllerInput {
  constructor() {
    this._Init();
  }

  _Init() {
    this._keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      space: false,
      shift: false,
      keyOne: false,
      keyTwo: false,
    };
    document.addEventListener("keydown", (e) => this._onKeyDown(e), false);
    document.addEventListener("keyup", (e) => this._onKeyUp(e), false);
    document.addEventListener("keydown", (e) => console.log(e));
  }

  _onKeyDown(event) {
    if (controllable) {
      switch (event.keyCode) {
        case 87: // w
          this._keys.forward = true;
          break;
        case 65: // a
          this._keys.left = true;
          break;
        case 83: // s
          this._keys.backward = true;
          break;
        case 68: // d
          this._keys.right = true;
          break;
        case 32: // SPACE
          this._keys.space = true;
          break;
        case 16: // SHIFT
          this._keys.shift = true;
          break;
        case 49: // 1
          this._keys.keyOne = true;
        case 50: // 2
          this._keys.keyTwo = true;

          break;
      }
    }
  }

  _onKeyUp(event) {
    if (controllable) {
      switch (event.keyCode) {
        case 87: // w
          this._keys.forward = false;
          break;
        case 65: // a
          this._keys.left = false;
          break;
        case 83: // s
          this._keys.backward = false;
          break;
        case 68: // d
          this._keys.right = false;
          break;
        case 32: // SPACE
          this._keys.space = false;
          break;
        case 16: // SHIFT
          this._keys.shift = false;
          break;
        case 49: // 1
          this._keys.keyOne = false;
        case 50: // 2
          this._keys.keyTwo = false;
          break;
      }
    }
  }
}

class FiniteStateMachine {
  constructor() {
    this._states = {};
    this._currentState = null;
  }

  _AddState(name, type) {
    this._states[name] = type;
  }

  SetState(name) {
    const prevState = this._currentState;

    if (prevState) {
      if (prevState.Name == name) {
        return;
      }
      prevState.Exit();
    }

    const state = new this._states[name](this);

    this._currentState = state;
    state.Enter(prevState);
  }

  Update(timeElapsed, input) {
    if (this._currentState) {
      this._currentState.Update(timeElapsed, input);
    }
  }
}

class CharacterFSM extends FiniteStateMachine {
  constructor(proxy) {
    super();
    this._proxy = proxy;
    this._Init();
  }

  _Init() {
    this._AddState("idle", IdleState);
    this._AddState("walk", WalkState);
    this._AddState("run", RunState);
    this._AddState("dance", DanceState);
    this._AddState("wave", WaveState);
    this._AddState("fight", FightState);
  }
}

class State {
  constructor(parent) {
    this._parent = parent;
  }

  Enter() {}
  Exit() {}
  Update() {}
}

class DanceState extends State {
  constructor(parent) {
    super(parent);

    this._FinishedCallback = () => {
      this._Finished();
    };
  }

  get Name() {
    return "dance";
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations["dance"].action;
    const mixer = curAction.getMixer();
    mixer.addEventListener("finished", this._FinishedCallback);

    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

      curAction.reset();
      curAction.setLoop(THREE.LoopOnce, 1);
      curAction.clampWhenFinished = true;
      curAction.crossFadeFrom(prevAction, 0.2, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  _Finished() {
    this._Cleanup();
    this._parent.SetState("idle");
  }

  _Cleanup() {
    const action = this._parent._proxy._animations["dance"].action;

    action.getMixer().removeEventListener("finished", this._CleanupCallback);
  }

  Exit() {
    this._Cleanup();
  }

  Update(_) {}
}

class FightState extends State {
  constructor(parent) {
    super(parent);

    this._FinishedCallback = () => {
      this._Finished();
    };
  }

  get Name() {
    return "fight";
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations["fight"].action;
    const mixer = curAction.getMixer();
    mixer.addEventListener("finished", this._FinishedCallback);

    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

      curAction.reset();
      curAction.setLoop(THREE.LoopRepeat, 2);
      curAction.clampWhenFinished = true;
      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  _Finished() {
    this._Cleanup();
    this._parent.SetState("idle");
  }

  _Cleanup() {
    const action = this._parent._proxy._animations["fight"].action;

    action.getMixer().removeEventListener("finished", this._CleanupCallback);
  }

  Exit() {
    this._Cleanup();
  }

  Update(_) {}
}

class WaveState extends State {
  constructor(parent) {
    super(parent);

    this._FinishedCallback = () => {
      this._Finished();
    };
  }

  get Name() {
    return "wave";
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations["wave"].action;
    const mixer = curAction.getMixer();
    mixer.addEventListener("finished", this._FinishedCallback);

    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

      curAction.reset();
      curAction.setLoop(THREE.LoopOnce, 1);
      curAction.clampWhenFinished = true;
      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  _Finished() {
    this._Cleanup();
    this._parent.SetState("idle");
  }

  _Cleanup() {
    const action = this._parent._proxy._animations["wave"].action;

    action.getMixer().removeEventListener("finished", this._CleanupCallback);
  }

  Exit() {
    this._Cleanup();
  }

  Update(_) {}
}

class WalkState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return "walk";
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations["walk"].action;
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

      curAction.enabled = true;

      if (prevState.Name == "run") {
        const ratio =
          curAction.getClip().duration / prevAction.getClip().duration;
        curAction.time = prevAction.time * ratio;
      } else {
        curAction.time = 0.0;
        curAction.setEffectiveTimeScale(1.0);
        curAction.setEffectiveWeight(1.0);
      }

      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  Exit() {}

  Update(timeElapsed, input) {
    if (input._keys.forward || input._keys.backward) {
      if (input._keys.shift) {
        this._parent.SetState("run");
      }
      return;
    }

    this._parent.SetState("idle");
  }
}

class RunState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return "run";
  }

  Enter(prevState) {
    const curAction = this._parent._proxy._animations["run"].action;
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

      curAction.enabled = true;

      if (prevState.Name == "walk") {
        const ratio =
          curAction.getClip().duration / prevAction.getClip().duration;
        curAction.time = prevAction.time * ratio;
      } else {
        curAction.time = 0.0;
        curAction.setEffectiveTimeScale(1.0);
        curAction.setEffectiveWeight(1.0);
      }

      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  Exit() {}

  Update(timeElapsed, input) {
    if (input._keys.forward || input._keys.backward) {
      if (!input._keys.shift) {
        this._parent.SetState("walk");
      }
      return;
    }

    this._parent.SetState("idle");
  }
}

class IdleState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return "idle";
  }

  Enter(prevState) {
    const idleAction = this._parent._proxy._animations["idle"].action;
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;
      idleAction.time = 0.0;
      idleAction.enabled = true;
      idleAction.setEffectiveTimeScale(1.0);
      idleAction.setEffectiveWeight(1.0);
      idleAction.crossFadeFrom(prevAction, 0.5, true);
      idleAction.play();
    } else {
      idleAction.play();
    }
  }

  Exit() {}

  Update(_, input) {
    if (input._keys.forward || input._keys.backward) {
      this._parent.SetState("walk");
    } else if (input._keys.keyOne) {
      this._parent.SetState("wave");
    } else if (input._keys.keyTwo) {
      this._parent.SetState("fight");
    }
  }
}

//replace idealOffSet(thisparamsrot) for startposition
const startAngle = new THREE.Quaternion();
startAngle.setFromAxisAngle(new THREE.Vector3(-0.08, -1.1, 0.3), Math.PI / 2);
//(zoom,height,left-right)
const startPosition = new THREE.Vector3(-4, -9, 4.3);

class ThirdPersonCamera {
  constructor(params) {
    this._params = params;
    this._camera = params.camera;
    this._currentPosition = new THREE.Vector3();
    this._currentLookat = new THREE.Vector3();
  }

  _CalculateIdealOffset() {
    const idealOffset = new THREE.Vector3(2, 20, -30);
    if (!startGame) {
      idealOffset.applyQuaternion(startAngle);
      idealOffset.add(startPosition);
    } else {
      idealOffset.applyQuaternion(this._params.target.Rotation);
      idealOffset.add(this._params.target.Position);
    }
    return idealOffset;
  }

  _CalculateIdealLookat() {
    const idealLookat = new THREE.Vector3(0, 10, 50);
    if (!startGame) {
      idealLookat.applyQuaternion(startAngle);
      idealLookat.add(startPosition);
    } else {
      idealLookat.applyQuaternion(this._params.target.Rotation);
      idealLookat.add(this._params.target.Position);
    }
    return idealLookat;
  }

  Update(timeElapsed) {
    const idealOffset = this._CalculateIdealOffset();
    const idealLookat = this._CalculateIdealLookat();

    // const t = 0.05;
    // const t = 4.0 * timeElapsed;
    const t = 1.0 - Math.pow(0.001, timeElapsed);

    this._currentPosition.lerp(idealOffset, t);
    this._currentLookat.lerp(idealLookat, t);

    this._camera.position.copy(this._currentPosition);
    this._camera.lookAt(this._currentLookat);
  }
}

class ThirdPersonCameraDemo {
  constructor() {
    this._Initialize();
  }

  _Initialize() {
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.outputEncoding = THREE.sRGBEncoding;
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this._threejs.domElement);

    window.addEventListener(
      "resize",
      () => {
        this._OnWindowResize();
      },
      false
    );

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(25, 10, 25);

    this._scene = new THREE.Scene();

    let light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.position.set(-100, 100, 100);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.left = 50;
    light.shadow.camera.right = -50;
    light.shadow.camera.top = 50;
    light.shadow.camera.bottom = -50;
    this._scene.add(light);

    light = new THREE.AmbientLight(0xffffff, 0.25);
    this._scene.add(light);

    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      "./world/map/posx.png",
      "./world/map/negx.png",
      "./world/map/posy.png",
      "./world/map/negy.png",
      "./world/map/posz.png",
      "./world/map/negz.png",
    ]);
    this._mixers = [];
    texture.encoding = THREE.sRGBEncoding;
    this._scene.background = texture;

    this._previousRAF = null;

    this._LoadAnimatedModels();
    this._RAF();
  }

  _LoadAnimatedModels() {
    const params = {
      camera: this._camera,
      scene: this._scene,
    };
    this._controls = new BasicCharacterController(params);

    this._thirdPersonCamera = new ThirdPersonCamera({
      camera: this._camera,
      target: this._controls,
    });

    const gokuLoader = new GLTFLoader();
    gokuLoader.load("./world/models/objects/goku/scene.gltf", (gltf) => {
      gltf.scene.scale.set(7, 7, 7);
      gltf.scene.position.set(80, 0, -20);
      gltf.scene.rotation.y = -1;

      const model = new THREE.AnimationMixer(gltf.scene);
      this._mixers.push(model);
      const idle = model.clipAction(gltf.animations[0]);
      idle.play();
      this._scene.add(gltf.scene);
    });
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _RAF() {
    requestAnimationFrame((t) => {
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }

      this._RAF();

      this._threejs.render(this._scene, this._camera);
      this._Step(t - this._previousRAF);
      this._previousRAF = t;
    });
  }

  _Step(timeElapsed) {
    const timeElapsedS = timeElapsed * 0.001;
    if (this._mixers) {
      this._mixers.map((m) => m.update(timeElapsedS));
    }

    if (this._controls) {
      this._controls.Update(timeElapsedS);
    }

    this._thirdPersonCamera.Update(timeElapsedS);
  }
}

let _APP = null;

window.addEventListener("DOMContentLoaded", () => {
  _APP = new ThirdPersonCameraDemo();
});

function _LerpOverFrames(frames, t) {
  const s = new THREE.Vector3(0, 0, 0);
  const e = new THREE.Vector3(100, 0, 0);
  const c = s.clone();

  for (let i = 0; i < frames; i++) {
    c.lerp(e, t);
  }
  return c;
}

function _TestLerp(t1, t2) {
  const v1 = _LerpOverFrames(100, t1);
  const v2 = _LerpOverFrames(50, t2);
  // console.log(v1.x + " | " + v2.x);
}

_TestLerp(0.01, 0.01);
_TestLerp(1.0 / 100.0, 1.0 / 50.0);
_TestLerp(1.0 - Math.pow(0.3, 1.0 / 100.0), 1.0 - Math.pow(0.3, 1.0 / 50.0));
