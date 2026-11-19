# Yumetics

Yumetics is a local Node.js app for meal logging and pantry-based recipe suggestions. Food photos are analyzed on the server with a Hugging Face vision-language model, so a dessert such as tiramisu is identified from the picture rather than guessed from its dominant colours.

## Run locally

1. Install Node.js 18 or later.
2. Set your Hugging Face token in your terminal (do not put it in source code):

   ```powershell
   $env:HF_TOKEN="your_hugging_face_token_here"
   npm start
   ```

3. Open `http://localhost:4174`.

The default model is `Qwen/Qwen2.5-VL-3B-Instruct`, a vision-language model served through Hugging Face Inference Providers. It can identify a prepared dish and estimate a visible portion; nutrition remains an estimate. You can change it through `HF_VISION_MODEL`.

If `HF_TOKEN` is not set, the app can optionally fall back to the OpenAI Responses API via `OPENAI_API_KEY`. The server keeps all tokens out of the browser.

## Upload to GitHub

The project includes a `.gitignore` that excludes secrets. From this folder:

```powershell
git init
git add .
git commit -m "Initial Yumetics release"
git branch -M main
git remote add origin https://github.com/YOUR-USER/YOUR-REPOSITORY.git
git push -u origin main
```

For a deployed app, configure `HF_TOKEN` (or `OPENAI_API_KEY`) as a secret/environment variable in the hosting service. Never commit a real token or `.env` file.
