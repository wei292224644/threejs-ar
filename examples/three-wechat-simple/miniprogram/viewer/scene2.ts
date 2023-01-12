import { EquirectangularReflectionMapping, FileLoader } from "three";
import { AssetsLoaderList } from "./assets-loader";
import { publishPath, Viewer, ViewerOptions } from "./base";
// import VideoPlayer from "./video-player";

const SCENE_ID = "5cvlv4xo_kzb";
const SCENE_VERSION = "7";

export class Scene2 extends Viewer {


    private variantIdx = -1;
    // private videoPlayer;
    // private vp: any;

    constructor(canvas: any, audioContext: any, options?: ViewerOptions) {
        super(canvas, audioContext, options);

        // this.videoPlayer = new VideoPlayer();
    }

    async init(callback?: () => void) {
        let jpath = publishPath + SCENE_ID + "/" + SCENE_VERSION + "/publish.json";
        const loader = new FileLoader();

        const data: any = await new Promise((resolve) => {
            loader.load(jpath, (d: any) => { d = JSON.parse(d); resolve(d) })
        })

        const scene = data.scene;

        const hdrPath = publishPath + scene.skyboxHDR;
        const assetDatas: any = {
            "kirinModel": {
                url: "https://emw-pub.uality.cn/qohsaw5u_p32/8/qohsaw5u_p32_sceneViewer.glb",
                type: "gltf"
            },
            "jingyuModel": {
                url: "https://emw-pub.uality.cn/qcnolauw_qg5/5/qcnolauw_qg5_sceneViewer.glb",
                type: "gltf"
            },
            "fangziModel": {
                url: "https://emw-pub.uality.cn/5cvlv4xo_kzb/11/5cvlv4xo_kzb_sceneViewer.glb",
                type: "gltf"
            },
            "hdr": {
                url: hdrPath,
                type: "hdr"
            },
            "reticle": {
                url: 'https://emw-pub.uality.cn/drnokeie_efi/2/drnokeie_efi_sceneViewer.glb',
                type: "gltf"
            }
        }

        for (let i = 0; data.audio && i < data.audio.length; i++) {
            assetDatas[`audio_` + i] = {
                url: publishPath + SCENE_ID + "/" + data.audio[i].path,
                type: "audio"
            }
        }
        const assets = new AssetsLoaderList(assetDatas);


        const res: any = await assets.load();

        const kirinModel = res.kirinModel;
        const jingyuModel = res.jingyuModel;
        const fangziModel = res.fangziModel;
        const reticle = res.reticle;
        const hdr = res.hdr;


        hdr.mapping = EquirectangularReflectionMapping;


        kirinModel.scene.scale.x = 0.577
        kirinModel.scene.scale.y = 0.577
        kirinModel.scene.scale.z = 0.577

        jingyuModel.scene.scale.x = 0.577
        jingyuModel.scene.scale.y = 0.577
        jingyuModel.scene.scale.z = 0.577        


        fangziModel.scene.scale.x = 0.577
        fangziModel.scene.scale.y = 0.577
        fangziModel.scene.scale.z = 0.577

        this.modelGroup.add(kirinModel.scene);
        this.modelGroup.add(jingyuModel.scene);
        this.modelGroup.add(fangziModel.scene);
        this.modelReticle.add(reticle.scene);


        const portal = kirinModel.scene;
        this.setOutsidePortal(portal);

        this.setBackground({ hdr: res.hdr, tonemapping: data.scene.tonemapping, exposure: data.scene.tonemapping_exposure })


        this.animation.setClips(jingyuModel.animations);

        // if (data.animationAudio) {
        //     const audios = [];
        //     for (let i = 0; i < data.animationAudio.length; i++) {
        //         const aData = data.animationAudio[i];
        //         const volume = aData.volume;
        //         const name = jingyuModel.animations[i].name;

        //         const audio = {
        //             name: name,
        //             volume: volume,
        //             src: publishPath + SCENE_ID + "/" + data.audio[aData.audio].path,
        //         }

        //         audios.push(audio);
        //     }
        //     this.animation.setAudios(audios);
        // }

        this.animation.play("Take 001");

        callback && callback();
    }


    update = (() => {
        return () => {
        }
    })()


    destroy() {

    }
}