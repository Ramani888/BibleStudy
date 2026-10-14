#!/bin/zsh
# Builds video 1 (1080x1920, 30fps) from raw simulator takes + rendered caption frames.
# Usage: RAW=raw ./build.sh   (take-a/a2/b/c.mov)      Frames come from render/frame.html → out/*.png
set -e
cd "${0:A:h}"
RAW=${RAW:?set RAW to the folder holding take-a/b/c.mov}
OUT=out; mkdir -p $OUT/seg

# Rounded-corner mask for the 690x1500 footage slot (matches .slot in render/frame.html).
python3 -c "
from PIL import Image, ImageDraw
m=Image.new('L',(690,1500),0); ImageDraw.Draw(m).rounded_rectangle([0,0,689,1499],56,fill=255); m.save('$OUT/mask.png')"

# name | source | start (s) | length (s) | caption frame
SEGMENTS=(
  "a1|take-a.mov|304.3|2.5|cap-a"
  "a2|take-a.mov|322.9|4.0|cap-a"
  "a3|take-a2.mov|195.5|3.0|cap-a"
  "a4|take-a2.mov|289.0|2.5|cap-a"
  "b1|take-b.mov|44.6|4.0|cap-b1"
  "b2|take-b.mov|82.0|3.2|cap-b2"
  "b3|take-b.mov|132.9|3.0|cap-b3"
  "c|take-c.mov|27.2|3.0|cap-c"
)

: > $OUT/list.txt
for s in $SEGMENTS; do
  IFS='|' read name src start len frame <<< "$s"
  ffmpeg -v error -y -i $RAW/$src -loop 1 -t $len -i $OUT/$frame.png -loop 1 -t $len -i $OUT/mask.png \
    -filter_complex "[0:v]fps=30,trim=start=$start:duration=$len,setpts=PTS-STARTPTS,scale=690:1500,format=rgba[v];[2:v]format=gray[m];[v][m]alphamerge[vm];[1:v][vm]overlay=195:370,format=yuv420p" \
    -t $len -r 30 -c:v libx264 -crf 18 -pix_fmt yuv420p -an $OUT/seg/$name.mp4
  echo "file 'seg/$name.mp4'" >> $OUT/list.txt
done

# End card: 3s with a short fade in.
ffmpeg -v error -y -loop 1 -t 3 -i $OUT/end.png -vf "fps=30,format=yuv420p,fade=t=in:st=0:d=0.4" \
  -c:v libx264 -crf 18 -pix_fmt yuv420p -an $OUT/seg/end.mp4
echo "file 'seg/end.mp4'" >> $OUT/list.txt

ffmpeg -v error -y -f concat -safe 0 -i $OUT/list.txt -c copy $OUT/${NAME:-video1}.mp4
echo "built $OUT/${NAME:-video1}.mp4"
