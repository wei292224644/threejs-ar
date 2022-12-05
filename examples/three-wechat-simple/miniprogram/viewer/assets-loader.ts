import { AudioLoader } from "three";

import { GLTFLoader } from "./GLTFLoader";
import { RGBELoader } from "./RGBELoader";

type AssetType = "hdr" | "gltf" | "audio";

type AssetData = {
    url: string
    type: AssetType
}


export class AssetsLoaderList {
    private _gltf: GLTFLoader;
    private _audio: AudioLoader;
    private _hdr: RGBELoader;


    private _assets: {
        [x: string]: AssetData
    }

    constructor(props: {
        [x: string]: AssetData
    }) {
        this._gltf = new GLTFLoader();
        this._audio = new AudioLoader();
        this._hdr = new RGBELoader();

        this._assets = props;
    }

    load() {
        return new Promise((resolve) => {

            const res: any = {};

            const keys = Object.keys(this._assets);
            const length = keys.length;
            let idx = 0;

            const onLoad = () => {
                idx++;
                console.log(idx);

                if (idx >= length)
                    resolve(res);
            }

            for (const key in this._assets) {

                const data = this._assets[key];

                switch (data.type) {
                    case "audio":
                        wx.request({
                            url: data.url,
                            responseType: "arraybuffer",
                            fail: (err) => {
                                console.log(err);
                            },
                            success: onLoad
                        })
                        // fetch(data.url).then(onLoad);
                        // this._audio.load(data.url, (buffer) => { res[key] = buffer; onLoad() })
                        break;
                    case "gltf":
                        this._gltf.load(data.url, (gltf:any) => { res[key] = gltf; onLoad() });
                        break;
                    case "hdr":
                        this._hdr.load(data.url, (texture:any) => { res[key] = texture; onLoad() });
                        break;
                    default:
                        break;
                }
            }
        })
    }

}