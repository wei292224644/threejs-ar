import { AnimationController } from "./animation";
import { WechatPlatform, PlatformManager } from 'platformize-three';
import {
    ACESFilmicToneMapping,
    Clock,
    LinearToneMapping,
    PerspectiveCamera,
    ReinhardToneMapping,
    Scene,
    sRGBEncoding,
    WebGL1Renderer,
    CubeTextureLoader,
    MeshBasicMaterial,
    Object3D,
    EquirectangularReflectionMapping,
    DataTexture,
    FileLoader,
    Vector3
} from "three";
import { AssetsLoaderList } from "./assets-loader";


export const publishPath = "https://emw-pub.uality.cn/";

export type ViewerOptions = {
    isKirin?: boolean
}

export class Viewer {

    private frameId: number = 0;
    private platform: WechatPlatform;


    private outsidePortalMat;

    private kirinRefCube;


    rootBone: Object3D;
    modelReticle: Object3D;
    modelGroup: Object3D;
    animation: AnimationController;
    renderHandler;
    renderer: WebGL1Renderer;
    scene: Scene;
    camera: PerspectiveCamera;
    clock: Clock;

    audioContext: any;


    private isKirin = false;

    constructor(canvas: any, audioContext: any, options?: ViewerOptions) {
        options = options || {};
        this.isKirin = !!options.isKirin;

        this.audioContext = audioContext;

        this.platform = new WechatPlatform(canvas);
        PlatformManager.set(this.platform);

        this.renderHandler = this.render.bind(this);

        this.renderer = new WebGL1Renderer({ canvas, antialias: true, alpha: true });
        this.renderer.outputEncoding = sRGBEncoding;

        this.scene = new Scene();

        this.animation = new AnimationController(this);

        this.clock = new Clock();

        this.camera = new PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 1000);
        this.camera.position.z = 3;

        const path = 'https://demo.uality.cn/cubemap/59/';
        const format = '.jpg';
        const urls = [
            path + 'px' + format, path + 'nx' + format,
            path + 'py' + format, path + 'ny' + format,
            path + 'pz' + format, path + 'nz' + format
        ];
        this.kirinRefCube = new CubeTextureLoader().load(urls);

        this.outsidePortalMat = new MeshBasicMaterial({
            colorWrite: false,
        })

        const rootBone = new Object3D();
        this.scene.add(rootBone);
        this.rootBone = rootBone;

        this.modelGroup = new Object3D();
        rootBone.add(this.modelGroup);

        this.modelReticle = new Object3D();
        rootBone.add(this.modelReticle);
        this.modelReticle.visible = false;


    }

    async init(options: any, callback?: () => void) {
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

                const gltf = res.gltf as GLTF;
                const reticle = res.reticle as GLTF;
                const hdr = res.hdr as DataTexture;

                this.scene.add(gltf.scene)
                this.scene.add(reticle.scene)

                reticle.scene.visible = false;

                hdr.mapping = EquirectangularReflectionMapping;
                this.setBackground({ hdr: hdr, tonemapping: data.scene.tonemapping, exposure: data.scene.tonemapping_exposure })

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
                callback && callback();
            });

        });
    }



    setBackground({ hdr, tonemapping, exposure }: any) {

        if (this.isKirin) {
            this.setKirinEnvMap(this.modelGroup);
            this.setKirinEnvMap(this.modelReticle);
        } else {
            this.scene.environment = hdr;
        }

        switch (tonemapping) {
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

        this.renderer.toneMappingExposure = exposure;
    }

    setKirinEnvMap(root: Object3D) {
        this.scene.environment = this.kirinRefCube;

        const bindEnvMap = (node: any) => {

            if (node.material) {
                node.material.envMap = this.kirinRefCube;
            }

            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                bindEnvMap(child);
            }
        }

        bindEnvMap(root);
    }


    setOutsidePortal(root: Object3D) {
        const setRenderOrder = (node: any) => {
            console.log(node);
            if (node.type == "Mesh") {
                node.renderOrder = -1;
                node.material = this.outsidePortalMat;
            }

            for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                setRenderOrder(child);
            }
        }
        setRenderOrder(root);
    }

    render() {
        this.frameId = requestAnimationFrame(this.renderHandler);
        this.renderer.render(this.scene, this.camera);
        const dt = this.clock.getDelta();
        this.animation.update(dt);

        this.update();
    }


    disableWithDistance = (() => {
        let cameraPos = new Vector3();
        let rootBonePos = new Vector3();

        return (distance: number) => {
            // this.camera.getWorldPosition(cameraPos);
            // this.rootBone.getWorldPosition(rootBonePos);

            const d = this.camera.position.distanceTo(this.rootBone.position);
            this.rootBone.visible = d < distance;
        }
    })()


    update() {

    }

    destroy() {
        cancelAnimationFrame(this.frameId);
        this.platform.dispose();
        this.renderer.dispose();
    }
}
