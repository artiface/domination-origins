#!/bin/bash

#convert -size 152x152 xc:Black -fill White -draw 'circle 76 76 76 1' -alpha Copy mask.png

for f in *.png
do
  echo "$f -> t_$f"
  convert "$f" -resize 350x350 "t_$f"
done
#for f in 7520.png 5592.png 6043.png; do convert "$f" -resize 76x76 "t_$f"; done

#for f in t_7520.png t_5592.png t_6043.png
#for f in $(ls t_*.png)
#do
#  echo "$f -> c${f}"
#  convert $f -gravity Center mask.png -compose CopyOpacity -composite -trim c${f}
#done


