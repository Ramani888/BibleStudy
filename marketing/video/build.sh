#!/bin/zsh
# Builds video 1 (1080x1920, 30fps) from raw simulator takes + rendered caption frames.
# Usage: RAW=raw [SEG_FILE=video3.segments NAME=video3] ./build.sh      Frames come from render/frame.html → out/*.png
set -e
cd "${0:A:h}"
RAW=${RAW:?set RAW to the folder holding take-a/b/c.mov}
OUT=out; mkdir -p $OUT/seg

# Rounded-corner mask for the 690x1500 footage slot (matches .slot in render/frame.html).
python3 -c "
from PIL import Image, ImageDraw
m=Image.new('L',(690,1500),0); ImageDraw.Draw(m).rounded_rectangle([0,0,689,1499],56,fill=255); m.save('$OUT/mask.png')"

# Clip list: <video>.segments (default video1). Lines: name|source|start|length|caption frame|speed
SEG_FILE=${SEG_FILE:-video1.segments}
SEGMENTS=("${(@f)$(grep -v '^#' $SEG_FILE | grep .)}")

: > $OUT/list.txt
for s in $SEGMENTS; do
  IFS='|' read name src start len frame speed <<< "$s"; speed=${speed:-1}
  ffmpeg -v error -y -i $RAW/$src -loop 1 -t $len -i $OUT/$frame.png -loop 1 -t $len -i $OUT/mask.png \
    -filter_complex "[0:v]fps=30,trim=start=$start:duration=$(( len * speed )),setpts=(PTS-STARTPTS)/$speed,scale=690:1500,format=rgba[v];[2:v]format=gray[m];[v][m]alphamerge[vm];[1:v][vm]overlay=195:370,format=yuv420p" \
    -t $len -r 30 -c:v libx264 -crf 18 -pix_fmt yuv420p -an $OUT/seg/$name.mp4
  echo "file 'seg/$name.mp4'" >> $OUT/list.txt
done

# End card: 3s with a short fade in.
ffmpeg -v error -y -loop 1 -t 3 -i $OUT/end.png -vf "fps=30,format=yuv420p,fade=t=in:st=0:d=0.4" \
  -c:v libx264 -crf 18 -pix_fmt yuv420p -an $OUT/seg/end.mp4
echo "file 'seg/end.mp4'" >> $OUT/list.txt

ffmpeg -v error -y -f concat -safe 0 -i $OUT/list.txt -c copy $OUT/${NAME:-video1}.mp4
echo "built $OUT/${NAME:-video1}.mp4"
