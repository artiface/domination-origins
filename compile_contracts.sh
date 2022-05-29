pushd "$(pwd)" > /dev/null || exit
cd contracts || exit

solc.sh ./batch_erc721.sol
solc.sh ./erc1155.sol

popd > /dev/null || exit
