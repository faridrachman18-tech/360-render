# API Notes

The local MVP defaults to mocked render jobs. Real provider calls live behind server-only routes and should be used only after the upload and viewer flow is stable.

## OpenAI

- Endpoint used: `POST https://api.openai.com/v1/images/edits`
- Model: `gpt-image-2`
- Output target: `3840x1920`
- Output format: `jpeg`
- Source: https://platform.openai.com/docs/guides/image-generation

## Topaz

- Start upscale: `POST https://api.topazlabs.com/image/v1/enhance/async`
- Poll status: `GET https://api.topazlabs.com/image/v1/status/{process_id}`
- Download final: `GET https://api.topazlabs.com/image/v1/download/{process_id}`
- Output target: `4096x2048`
- Source: https://developer.topazlabs.com/api-reference/api-endpoints/image/enhance
