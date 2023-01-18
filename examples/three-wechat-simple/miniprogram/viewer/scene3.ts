import { EquirectangularReflectionMapping, FileLoader } from "three";
import { AssetsLoaderList } from "./assets-loader";
import { publishPath, Viewer, ViewerOptions } from "./base";
// import VideoPlayer from "./video-player";


export class Scene3 extends Viewer {
    constructor(canvas: any, audioContext: any, options?: ViewerOptions) {
        super(canvas, audioContext, options);
    }

    async init(options: {
        baseSceneId: string,
        baseSceneVersion: string,
        kirinSceneId: string,
        kirinSceneVersion: string,
        scale: number
    }, callback?: () => void) {
        if (!options.baseSceneId) return;

        let jpath = publishPath + options.baseSceneId + "/" + options.baseSceneVersion + "/publish.json";
        const loader = new FileLoader();

        const data: any = await new Promise((resolve) => {
            loader.load(jpath, (d: any) => { d = JSON.parse(d); resolve(d) })
        })

        const scene = data.scene;

        const hdrPath = publishPath + scene.skyboxHDR;
        const assetDatas: any = {
            "kirinModel": {
                url: `https://emw-pub.uality.cn/${options.kirinSceneId}/${options.kirinSceneVersion}/${options.kirinSceneId}_sceneViewer.glb`,
                type: "gltf"
            },

            "baseModel": {
                url: `https://emw-pub.uality.cn/${options.baseSceneId}/${options.baseSceneVersion}/${options.baseSceneId}_sceneViewer.glb`,
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
                url: publishPath + options.baseSceneId + "/" + data.audio[i].path,
                type: "audio"
            }
        }
        const assets = new AssetsLoaderList(assetDatas);


        const res: any = await assets.load();

        const kirinModel = res.kirinModel;
        const baseModel = res.baseModel;
        const reticle = res.reticle;
        const hdr = res.hdr;


        hdr.mapping = EquirectangularReflectionMapping;


        kirinModel.scene.scale.x = options.scale;
        kirinModel.scene.scale.y = options.scale;
        kirinModel.scene.scale.z = options.scale;

        baseModel.scene.scale.x = options.scale;
        baseModel.scene.scale.y = options.scale;
        baseModel.scene.scale.z = options.scale;

        this.modelGroup.add(kirinModel.scene);
        // this.modelGroup.add(jingyuModel.scene);
        this.modelGroup.add(baseModel.scene);
        this.modelReticle.add(reticle.scene);


        const portal = kirinModel.scene;
        this.setOutsidePortal(portal);

        this.setBackground({ hdr: res.hdr, tonemapping: data.scene.tonemapping, exposure: data.scene.tonemapping_exposure })


        this.animation.setClips(baseModel.animations);

        if (data.animationAudio) {
            const audios = [];
            for (let i = 0; i < data.animationAudio.length; i++) {
                const aData = data.animationAudio[i];
                const volume = aData.volume;
                const name = baseModel.animations[i].name;

                const audio = {
                    name: name,
                    volume: volume,
                    src: publishPath + options.baseSceneId + "/" + data.audio[aData.audio].path,
                }

                audios.push(audio);
            }
            this.animation.setAudios(audios);
        }
        callback && callback();
    }


    update = (() => {
        return () => {
        }
    })()

    destroy() {

    }
}