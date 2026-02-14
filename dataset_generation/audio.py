import read_audio as ra
import sounddevice as sd
from scipy.io.wavfile import write

fs = 16000  # sampling rate Whisper expects
seconds = 5

print("Speak now...")
audio = sd.rec(int(seconds * fs), samplerate=fs, channels=1)
sd.wait()

write("voice.wav", fs, audio)
print("Saved as voice.wav")
ra.gg()


