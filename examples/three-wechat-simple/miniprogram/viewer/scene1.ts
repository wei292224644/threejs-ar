import { EquirectangularReflectionMapping, FileLoader } from "three";
import { AssetsLoaderList } from "./assets-loader";
import { publishPath, Viewer, ViewerOptions } from "./base";
// import VideoPlayer from "./video-player";

const SCENE_ID = "qohsaw5u_p32";
const SCENE_VERSION = "latest";

export class Scene1 extends Viewer {

    private gltf: any;
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

        const gltfPath = publishPath + SCENE_ID + "/" + scene.gltf.replace(/.glb$/ig, "_sceneViewer.glb");;
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

        const gltf = res.gltf;
        const reticle = res.reticle;
        const hdr = res.hdr;


        hdr.mapping = EquirectangularReflectionMapping;

        this.gltf = gltf;

        this.modelGroup.add(gltf.scene);
        this.modelReticle.add(reticle.scene);


        const portal = gltf.scene.getObjectByName("Object002");
        this.setOutsidePortal(portal);

        this.setBackground({ hdr: res.hdr, tonemapping: data.scene.tonemapping, exposure: data.scene.tonemapping_exposure })


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
                    src: publishPath + SCENE_ID + "/" + data.audio[aData.audio].path,
                }

                audios.push(audio);
            }
            this.animation.setAudios(audios);
        }

        this.animation.play("Take 001");

        callback && callback();
    }


    async changeMaterialVariants(idx: number) {

        if (!this.gltf.userData || !this.gltf.userData.materialVariants) return;

        if (this.variantIdx == idx) return;


        for (let i = 0; i < this.gltf.userData.materialVariants.length; i++) {
            const variants = this.gltf.userData.materialVariants[i];

            const variant = variants.variantsData[idx];

            for (let j = 0; j < variant.materialMapping.length; j++) {
                const map = variant.materialMapping[j];


                const mesh = await this.gltf.parser.getDependency("mesh", map.mesh);

                for (let k = 0; k < map.primitiveMaterial.length; k++) {
                    const matIdx = map.primitiveMaterial[k];
                    const mat = await this.gltf.parser.getDependency("material", matIdx);
                    mesh.material = mat;
                }
            }
        }

        this.variantIdx = idx;
    }

    update = (() => {
        let cacheTime = 0;
        return () => {


            const mixer = this.animation.mixer;
            const currentClip = this.animation.currentClip;

            if (currentClip) {
                const action = mixer.clipAction(currentClip, this.scene);

                if (action.time < 4.6) { //115
                    this.changeMaterialVariants(0);
                } else if (action.time < 14.96) {
                    this.changeMaterialVariants(1);
                } else if (action.time < 19) {
                    this.changeMaterialVariants(2);
                }

                // if (cacheTime > action.time) {
                //     console.log(action.time);

                //     if (this.vp) {
                //         this.vp.decoder.restart();
                //     }
                // }
                // cacheTime = action.time;
            }


            // if (this.vp) {
            //     this.vp.play()
            // }
        }
    })()


    destroy() {

    }
}