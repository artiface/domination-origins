target="$2"
image_dir="${target}/images"
data_dir="${target}/opensea"
meta_dir="${target}/metadata"
pushd $(pwd) > /dev/null
cd hashlips_art_engine
node index.js $1 normal
popd > /dev/null
mv "./hashlips_art_engine/build/images/${1}.png" "${image_dir}/"
mv "./hashlips_art_engine/build/json/${1}.json" "${data_dir}/"

python3 Tools/change_metadata.py single $1 "${meta_dir}/"

