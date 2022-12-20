//@ts-nocheck

export default class VideoPlayer {

    constructor() {
        this.decoder = wx.createVideoDecoder()
        const videoUrl = 'https://cdn2.h5no1.com/static-cdn/cpbz/v.mp4';
        this.dataUriList = []
    }
    getCanvasNode(id) {
        return new Promise((resolve) => {
            wx.createSelectorQuery()
                .select('#' + id)
                .node(res => resolve(res.node))
                .exec();
        });
    }
    async downLoad(url) { // 下载视频并压缩视频，如果不压缩可能会卡
        return new Promise(resolve => {
            wx.downloadFile({
                url,
                success: res => {
                    wx.compressVideo({
                        quality: 'low',
                        // resolution:0.9,
                        // fps:60,
                        src: res.tempFilePath,
                        success: result => {
                            console.log(result)
                            resolve(result.tempFilePath)
                        }
                    })

                },
                fail: () => {
                    resolve(url)
                }
            })
        })
    }
    async playVideo(id, videoUrl, cb) {
        const canvas = await this.getCanvasNode(id) //获取2dcanvas节点
        const path = await this.downLoad(videoUrl) // 下载视频并返回本地地址
        const context = canvas.getContext('2d') // 2d上下文

        const render = ({ data, width, height }) => { // 渲染2d时，返回DataURI数据，作为纹理数据
            canvas.height = height
            canvas.width = width
            const imageData = canvas.createImageData(data, width, height)
            context.putImageData(imageData, 0, 0)
            if (canvas.toDataURL) {
                cb && cb(canvas.toDataURL()) // cb回调方法
            }
        }
        const decoder = wx.createVideoDecoder() // 创建视频解码器
        await decoder.start({ // 开始解码
            abortAudio: true,
            source: path || videoUrl // tempFilePath,
        })




        return Promise.resolve({
            decoder,
            context,
            restart: async () => {
                await decoder.seek(0.01);
                await decoder.start({
                    abortAudio: true,
                    source: path || videoUrl // tempFilePath,
                })
            },
            stop() {
                return decoder.remove()
            },
            play: async () => {
                let imageData = decoder.getFrameData() // 获取下一帧的解码数据
                if (imageData) {
                    render(imageData)
                }
            }
        })
    }


}