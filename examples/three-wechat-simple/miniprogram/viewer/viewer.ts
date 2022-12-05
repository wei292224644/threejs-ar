import { AnimationController } from "./animation";
import { WechatPlatform, PlatformManager } from 'platformize-three';
import {
    ACESFilmicToneMapping,
    Clock,
    DataTexture,
    EquirectangularReflectionMapping,
    FileLoader,
    Group,
    LinearToneMapping,
    PerspectiveCamera,
    ReinhardToneMapping,
    Scene,
    sRGBEncoding,
    WebGL1Renderer,
    CullFaceNone,
    CubeTextureLoader
} from "three";
import { AssetsLoaderList } from "./assets-loader";



export const publishPath = "https://emw-pub.uality.cn/";

export class Viewer {

    private frameId: number = 0;
    private platform: WechatPlatform;

    modelReticle?: Group;
    modelGroup?: Group;
    animation: AnimationController;
    renderHandler;
    renderer: WebGL1Renderer;
    scene: Scene;
    camera: PerspectiveCamera;
    clock: Clock;

    audioContext: any;
    private started = false;

    constructor(canvas: any, audioContext: any) {

        this.audioContext = audioContext;

        this.platform = new WechatPlatform(canvas);
        PlatformManager.set(this.platform);


        this.renderer = new WebGL1Renderer({ canvas, antialias: true, alpha: true });
        // this.renderer.autoClearColor = false;
        // this.renderer.state.setCullFace(CullFaceNone);


        this.scene = new Scene();
        this.animation = new AnimationController(this);

        this.renderHandler = this.render.bind(this);

        this.camera = new PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 1000);
        this.camera.position.z = 10;

        this.clock = new Clock();

        this.renderer.outputEncoding = sRGBEncoding;
        // this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // const resize = () => {
        //     canvas.width = window.innerWidth;
        //     canvas.height = window.innerHeight;

        //     this.camera.aspect = canvas.width / canvas.height;
        //     this.camera.updateProjectionMatrix();

        //     this.renderer.setSize(canvas.width, canvas.height);
        // }

        // resize();
        // window.addEventListener("resize", resize, false);
    }

    init(options: any, callback?: () => void) {
        let jpath = publishPath + options.id + "/" + (options.version || "latest") + "/publish.json";
        const loader = new FileLoader();
        loader.load(jpath, (data: any) => {
            data = JSON.parse(data);
            const scene = data.scene;


            const gltfPath = publishPath + options.id + "/" + scene.gltf.replace(/.glb$/ig, "_sceneViewer.glb");;
            const hdrPath = publishPath + scene.skyboxHDR;
            const assetDatas: any = {
                "gltf": {
                    url: gltfPath,
                    type: "gltf"
                },
                "hdr": {
                    url: hdrPath,
                    type: "hdr"
                },
                "reticle": {
                    url: 'https://emw-pub.uality.cn/drnokeie_efi/2/drnokeie_efi.glb',
                    type: "gltf"
                }

            }


            for (let i = 0; data.audio && i < data.audio.length; i++) {
                assetDatas[`audio_` + i] = {
                    url: publishPath + options.id + "/" + data.audio[i].path,
                    type: "audio"
                }
            }

            const assets = new AssetsLoaderList(assetDatas);


            assets.load().then((res: any) => {

                const gltf = res.gltf;
                const reticle = res.reticle;
                const hdr = res.hdr as DataTexture;

                this.scene.add(gltf.scene)
                this.scene.add(reticle.scene)

                reticle.scene.visible = false;


                // hdr.mapping = EquirectangularReflectionMapping;
                // this.scene.environment = hdr;


                const path = 'https://demo.uality.cn/cubemap/SwedishRoyalCastle/';
                const format = '.jpg';
                const urls = [
                    path + 'px' + format, path + 'nx' + format,
                    path + 'py' + format, path + 'ny' + format,
                    path + 'pz' + format, path + 'nz' + format
                ];

                const reflectionCube = new CubeTextureLoader().load(urls);
                this.scene.environment = reflectionCube;


                switch (data.scene.tonemapping) {
                    case "1":
                        //linear
                        this.renderer.toneMapping = LinearToneMapping;
                        break;
                    case "2":
                        //filmic
                        this.renderer.toneMapping = ACESFilmicToneMapping;
                        break;
                    case "3":
                        //hejl
                        this.renderer.toneMapping = ReinhardToneMapping;
                        break;
                    case "4":
                        //ACES filmic
                        this.renderer.toneMapping = ACESFilmicToneMapping;
                        break;
                    case "5":
                        //ACES v2 filmic
                        this.renderer.toneMapping = ReinhardToneMapping;
                        break;
                }

                this.renderer.toneMappingExposure = data.scene.tonemapping_exposure;



                this.animation.setClips(gltf.animations);

                if (data.animationAudio) {
                    const audios = [];
                    for (let i = 0; i < data.animationAudio.length; i++) {
                        const aData = data.animationAudio[i];
                        const volume = aData.volume;
                        const name = gltf.animations[i].name;

                        const audio = {
                            name: name,
                            volume: volume,
                            src: publishPath + options.id + "/" + data.audio[aData.audio].path,
                        }

                        audios.push(audio);
                    }
                    this.animation.setAudios(audios);
                }

                this.modelGroup = gltf.scene;
                this.modelReticle = reticle.scene;
                this.started = true;
                callback && callback();
            });
        });
    }
    render() {
        requestAnimationFrame(this.renderHandler);
        this.renderer.render(this.scene, this.camera);
        const dt = this.clock.getDelta();
        this.animation.update(dt);
    }


    destroy() {
        this.platform.dispose();
    }
}