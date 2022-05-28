target="$2"
image_dir="${target}/images"
data_dir="${target}/opensea"
pushd $(pwd) > /dev/null
cd hashlips_art_engine
node index.js $1 starter
popd > /dev/null
mv "./hashlips_art_engine/build/images/${1}.png" "${image_dir}/"
mv "./hashlips_art_engine/build/json/${1}.json" "${data_dir}/"