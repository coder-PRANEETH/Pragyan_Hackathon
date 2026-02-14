from faster_whisper import WhisperModel
def gg():
# load model (downloads once, then stored locally)
    model = WhisperModel("base", compute_type="int8")

    segments, info = model.transcribe("voice.wav")

    print("Detected language:", info.language)

    for segment in segments:
        print(segment.text)
