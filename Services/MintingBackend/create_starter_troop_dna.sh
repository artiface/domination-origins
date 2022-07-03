image_dir="/home/worker/hashlips_art_engine/build/thumbs"
cd /home/worker/hashlips_art_engine || exit
DNA=$(node index.js "$1" starter) && \
convert "/home/worker/hashlips_art_engine/build/images/${1}.png" -resize 350x350 "${image_dir}/t_${1}.png" > /dev/null &&  \
cd /home/worker && \
python3 Tools/change_metadata.py single "$1" "/home/worker/hashlips_art_engine/build/" && \
echo "$DNA"
