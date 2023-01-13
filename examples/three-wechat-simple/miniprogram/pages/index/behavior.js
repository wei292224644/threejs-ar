import {
    Scene1, Scene2, Viewer
} from "../viewer/viewer";

export default function getBehavior() {
    return Behavior({
        data: {
            width: 1,
            height: 1,
            fps: 0,
            memory: 0,
            cpu: 0,
        },
        methods: {
            onReady() {
                wx.createSelectorQuery()
                    .select('#cameraTexture')
                    .node()
                    .exec(textureRes => {
                        this.textureCanvasGL = textureRes[0].node.getContext('webgl');
                    })

                wx.createSelectorQuery()
                    .select('#webgl')
                    .node()
                    .exec(res => {
                        this.canvas = res[0].node

                        const info = wx.getSystemInfoSync()
                        const pixelRatio = info.pixelRatio
                        const calcSize = (width, height) => {
                            console.log(`canvas size: width = ${width} , height = ${height}`)
                            this.canvas.width = width * pixelRatio
                            this.canvas.height = height * pixelRatio
                            this.setData({
                                width,
                                height,
                            })
                        }
                        calcSize(info.windowWidth, info.windowHeight)

                        this.initVK()
                    })



            },
            onUnload() { },
            initVK() {

                this.innerAudioContext = wx.createInnerAudioContext({
                    useWebAudioImplement: false // 是否使用 WebAudio 作为底层音频驱动，默认关闭。对于短音频、播放频繁的音频建议开启此选项，开启后将获得更优的性能表现。由于开启此选项后也会带来一定的内存增长，因此对于长音频建议关闭此选项
                })
                this.innerAudioContext.loop = true;

                const canvas = this.canvas;
                this.viewer = new Viewer(canvas, this.innerAudioContext);
                this.viewer.init({
                    id: "ljmp55hm_nib"
                }, () => {  
                    console.log('123')

                    // setTimeout(() => {
                    //     this.viewer.animation.pause();
                    // },3000)

                    // setTimeout(()=>{
                    //     this.viewer.animation.resume();
                    // },5000)
                });
                this.viewer.render();

                // this.viewer = new Viewer(canvas, this.innerAudioContext,{
                //     isKirin:true
                // });
                // this.viewer.init({
                //     // id: "w4brnnfq_gwl",
                //     // version: 10,
                //     // id: "zmcugkwi_13o",
                //     // id: "gddebkfo_yrj",
                //     // id: "glehb55g_a2u",
                //     // version:2,
                //     // id: "450yztqd_mh5",
                //     id:"scene1"
                // }, () => {
                //     console.log("started");

                //     // for (const [key, clip] of this.viewer.animation.clips) {
                //     //     this.viewer.animation.play(key);
                //     //     break;
                //     // }

                //     const info = wx.getSystemInfoSync()
                //     calcSize(info.windowWidth, info.windowHeight, info.pixelRatio);
                // });

                // this.viewer.render();


                // 自定义初始化
                if (this.init) this.init()

                const calcSize = (width, height, pixelRatio) => {
                    console.log(`canvas size: width = ${width} , height = ${height}`)
                    this.canvas.width = width * pixelRatio
                    this.canvas.height = height * pixelRatio

                    this.viewer.camera.aspect = this.canvas.width / this.canvas.height;
                    this.viewer.camera.updateProjectionMatrix();

                    this.viewer.renderer.setSize(this.canvas.width, this.canvas.height);

                    console.log(width, height);
                    this.setData({
                        width,
                        height,
                    })
                }

                const info = wx.getSystemInfoSync()
                calcSize(info.windowWidth, info.windowHeight, info.pixelRatio / 1.5);

                const session = this.session = wx.createVKSession({
                    track: {
                        plane: {
                            mode: 3
                        },
                    },
                    version: 'v1',
                    gl: this.textureCanvasGL
                })

                session.on('resize', () => {
                    const info = wx.getSystemInfoSync()
                    calcSize(info.windowWidth, info.windowHeight, info.pixelRatio / 1.5)
                })
                session.start(err => {
                    if (err) return console.error('VK error: ', err)

                    console.log('@@@@@@@@ VKSession.version', session.version)

                    // 逐帧渲染
                    const onFrame = timestamp => {
                        // let start = Date.now()
                        // debugger
                        const frame = session.getVKFrame(canvas.width, canvas.height)
                        if (frame) {
                            this.render(frame)
                        }

                        session.requestAnimationFrame(onFrame)
                    }
                    onFrame();
                })
            },
            onTouchEnd(evt) {
                console.log(this.viewer.modelGroup, this.viewer.modelReticle);
                if (this.viewer.modelGroup && this.viewer.modelReticle) {
                    this.viewer.modelGroup.position.copy(this.viewer.modelReticle.position)
                    this.viewer.modelGroup.rotation.copy(this.viewer.modelReticle.rotation)
                }
            }
        },
    })
}