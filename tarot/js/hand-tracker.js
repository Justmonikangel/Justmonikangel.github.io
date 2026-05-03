// MediaPipe Hands 集成 —— 把摄像头抓取手势翻译成 (x, y, isGrabbing) 事件。
// 通过 ESM 动态 import 从 jsDelivr 加载 @mediapipe/tasks-vision，避免在模块顶部加载导致静态站点失败。

class HandTracker {
  constructor({ video, canvas, statusEl, onFrame }) {
    this.video = video;
    this.canvas = canvas;
    this.statusEl = statusEl;
    this.onFrame = onFrame;
    this.running = false;
    this.lastVideoTime = -1;
    this.landmarker = null;
    this.ctx = canvas.getContext("2d");
  }

  setStatus(t) { if (this.statusEl) this.statusEl.textContent = t; }

  async start() {
    if (this.running) return;
    try {
      this.setStatus("加载手势模型…");
      const vision = await import(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs"
      );
      const filesetResolver = await vision.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );
      this.landmarker = await vision.HandLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 1,
      });

      this.setStatus("打开摄像头…");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      this.video.srcObject = stream;
      await new Promise(res => this.video.onloadedmetadata = res);
      await this.video.play();
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
      this.running = true;
      this.setStatus("已就绪 · 张开 → 合拢抓牌");
      this._loop();
    } catch (err) {
      console.error(err);
      this.setStatus("启动失败：" + (err.message || err));
      throw err;
    }
  }

  stop() {
    this.running = false;
    const stream = this.video.srcObject;
    if (stream) stream.getTracks().forEach(t => t.stop());
    this.video.srcObject = null;
    this.setStatus("已关闭");
  }

  _loop = () => {
    if (!this.running) return;
    if (this.video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.video.currentTime;
      const result = this.landmarker.detectForVideo(this.video, performance.now());
      this._draw(result);
      this._emit(result);
    }
    requestAnimationFrame(this._loop);
  };

  _draw(result) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (!result.landmarks || !result.landmarks.length) return;
    const lm = result.landmarks[0];
    ctx.strokeStyle = "rgba(217,184,107,0.85)";
    ctx.lineWidth = 2;
    ctx.fillStyle = "rgba(201,123,156,0.9)";
    const connections = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [5,9],[9,10],[10,11],[11,12],
      [9,13],[13,14],[14,15],[15,16],
      [13,17],[17,18],[18,19],[19,20],[0,17],
    ];
    const w = this.canvas.width, h = this.canvas.height;
    ctx.beginPath();
    for (const [a, b] of connections) {
      ctx.moveTo(lm[a].x * w, lm[a].y * h);
      ctx.lineTo(lm[b].x * w, lm[b].y * h);
    }
    ctx.stroke();
    for (const p of lm) {
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _emit(result) {
    if (!this.onFrame) return;
    if (!result.landmarks || !result.landmarks.length) {
      this.onFrame(null);
      return;
    }
    const lm = result.landmarks[0];
    const thumb = lm[4];
    const index = lm[8];
    const middle = lm[12];
    const wrist = lm[0];
    const pinch = Math.hypot(thumb.x - index.x, thumb.y - index.y);
    const span = Math.hypot(wrist.x - middle.x, wrist.y - middle.y) || 1;
    const ratio = pinch / span;
    // ratio < 0.25 ≈ 抓握；> 0.45 ≈ 张开
    const isGrabbing = ratio < 0.28;

    // 用食指根 (5) 作为光标定位点，比指尖稳
    const cursor = lm[5];
    // 镜像翻转 X（视频是 mirrored 显示的）
    this.onFrame({
      x: 1 - cursor.x,
      y: cursor.y,
      isGrabbing,
      pinchRatio: ratio,
    });
  }
}

if (typeof window !== "undefined") {
  window.HandTracker = HandTracker;
}
