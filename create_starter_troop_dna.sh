target="$2"
image_dir="${target}/images"
data_dir="${target}/opensea"
pushd "$(pwd)" > /dev/null || exit
cd hashlips_art_engine || exit
node index.js $1 starter
popd > /dev/null || exit

convert "./hashlips_art_engine/build/images/${1}.png" -resize 350x350 "${image_dir}/${1}.png"
mv "./hashlips_art_engine/build/json/${1}.json" "${data_dir}/"

python3 Tools/change_metadata.py single $1 "${target}/"