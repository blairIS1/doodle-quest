#!/bin/bash
# Generates MP3 voice lines from voices.json
# Reads voice actor + rate from voice.config.json (or uses defaults)

DIR="public/audio"
JSON="voices.json"
CONFIG="voice.config.json"

# Defaults
VOICE="en-US-AnaNeural"
RATE="-5%"

# Override from config if it exists
if [ -f "$CONFIG" ]; then
  VOICE=$(jq -r '.voice // "en-US-AnaNeural"' "$CONFIG")
  RATE=$(jq -r '.rate // "-5%"' "$CONFIG")
  echo "🎤 Voice: $VOICE | Rate: $RATE (from $CONFIG)"
else
  echo "🎤 Voice: $VOICE | Rate: $RATE (defaults)"
fi

if [ ! -f "$JSON" ]; then echo "❌ $JSON not found"; exit 1; fi
mkdir -p "$DIR"

if [ "$1" = "--force" ]; then
  echo "🔄 Force mode — regenerating all..."
  rm -f "$DIR"/*.mp3
fi

count=0
for key in $(jq -r 'keys[]' "$JSON"); do
  text=$(jq -r --arg k "$key" '.[$k]' "$JSON")
  out="$DIR/${key}.mp3"
  if [ -f "$out" ]; then
    echo "  ✅ $key (exists)"
  else
    echo "  🎙️ $key"
    edge-tts --voice "$VOICE" --rate="$RATE" --text "$text" --write-media "$out" 2>/dev/null
    count=$((count + 1))
  fi
done

echo ""
echo "Done! Generated $count new files. Total: $(ls "$DIR"/*.mp3 2>/dev/null | wc -l | tr -d ' ') MP3s in $DIR/"
