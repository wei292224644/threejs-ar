import { CanvasTexture, Color, DoubleSide, EquirectangularReflectionMapping, FileLoader, Mesh, MeshBasicMaterial, NearestFilter, PlaneGeometry, TextureLoader, VideoTexture } from "three";
import { AssetsLoaderList } from "./assets-loader";
import { publishPath, Viewer, ViewerOptions } from "./base";
// import VideoPlayer from "./video-player";

const SCENE_ID = "2g3xfoei_3y0";
const SCENE_VERSION = "8";

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


        // const material = new MeshBasicMaterial({ side: DoubleSide });
        // const bg = gltf.scene.getObjectByName("part_012");
        // bg.material.color = new Color(0x333333);


        // var material = new MeshBasicMaterial({ side: DoubleSide });
        // var geometry = new PlaneGeometry(100, 100 / 2, 1);
        // var plane3 = new Mesh(geometry, material);
        // this.modelGroup.add(plane3);

        // var textureLoader = new TextureLoader();

        // this.videoPlayer.playVideo('target1', 'https://demo.uality.cn/Telefonica.mp4', async (res: any) => {
        //     if (res) {
        //         textureLoader.load(res, texture => { // 加载datauri数据到纹理，一定要写在回调里，不然也看着卡顿
        //             texture.minFilter = NearestFilter
        //             plane3.material.map = texture
        //         });

        //     }

        // }).then(res => {
        //     this.vp = res;
        //     const context = res.context;

        //     const canvasTexture = new CanvasTexture(context.canvas);
        //     canvasTexture.minFilter = NearestFilter;
        //     bg.material.map = canvasTexture;
        // })

        callback && callback();
    }


    async changeMaterialVariants(idx: number) {

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