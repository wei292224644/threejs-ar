
import { AnimationClip, AnimationMixer } from "three";
import { Viewer } from "./viewer";


type AudioState = {
    name: string
    volume: number
    src: string
}
export class AnimationController {
    mixer: AnimationMixer;

    private paused = false;

    private clips = new Map<string, AnimationClip>();

    private audios = new Map<string, AudioState>();

    currentClip?: AnimationClip | undefined;

    constructor(private viewer: Viewer) {
        this.mixer = new AnimationMixer(this.viewer.scene);
    }


    setClips(clips: AnimationClip[]) {
        clips.forEach((c) => {
            this.clips.set(c.name, c);
        })
    }

    setAudios(audios: AudioState[]) {
        audios.forEach((c) => {
            this.audios.set(c.name, c);
        })
    }

    play(name: string) {
        const clip = this.clips.get(name);

        if (!clip) return;

        const audio = this.audios.get(name);

        if (audio) {
            this.viewer.audioContext.src = audio.src;
            this.viewer.audioContext.volume = audio.volume;
            this.viewer.audioContext.play();
        }

        this.mixer.clipAction(clip, this.viewer.scene).play();
        this.currentClip = clip;


        this.paused = false;
    }

    pause() {
        this.paused = true;
        // this.viewer.audioContext.pause();
    }

    resume() {
        this.paused = false;
        // this.viewer.audioContext.play();
    }

    stop() {
        this.mixer.stopAllAction();


        if (this.currentClip) {
            const name = this.currentClip.name;

            const audio = this.audios.get(name);

            if (audio) {
                this.viewer.audioContext.stop();
            }

            this.currentClip = undefined;
        }
    }

    update = (() => {
        let cacheTime = 0;
        return (dt: number) => {

            if (this.paused) return;

            this.mixer.update(dt);

            if (this.currentClip) {
                const action = this.mixer.clipAction(this.currentClip, this.viewer.scene)
                if (cacheTime > action.time) {
                    console.log(action.time);
                    const audio = this.audios.get(this.currentClip.name);

                    if (audio) {
                        this.viewer.audioContext.stop();
                        setTimeout(() => {
                            this.viewer.audioContext.startTime = action.time;
                            this.viewer.audioContext.play();
                        }, 0);
                    }
                }
                cacheTime = action.time;
            }

            // if (time < 0.01 && cacheTime > time) {


            //     const audio = this.audios.get(this.currentClip.name);

            //     if (audio) {
            //         this.viewer.audioContext.stop();
            //         setTimeout(() => {
            //             this.viewer.audioContext.startTime = time;
            //             this.viewer.audioContext.play();
            //         }, 0);
            //     }
            // }
            // cacheTime = time;

        }
    })()
}