import {
  JsonMetadata,
  Metadata,
  Nft,
  toMetaplexFile,
} from "@metaplex-foundation/js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMetaplex } from "hooks/useMetaplex";
import { FC, useState } from "react";
import { useForm } from "react-hook-form";

interface FormProps {
  name: string;
  description: string;
  image: any;
}

export const MetaplexView: FC = ({}) => {
  const { metaplex: mx } = useMetaplex();
  const wallet = useWallet();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [nft, setNft] = useState<Nft>(null);

  async function createNft(data: FormProps) {
    try {
      var reader = new FileReader();
      const fileData = new Blob([data.image[0]]);
      reader.readAsArrayBuffer(fileData);
      reader.onload = async function (event) {
        const arrayBuffer = reader.result;

        const { uri, metadata } = await mx
          .nfts()
          .uploadMetadata({
            name: data.name,
            description: data.description,
            image: toMetaplexFile(arrayBuffer, "metaplex.png"),
          })
          .run();

        const { nft } = await mx
          .nfts()
          .create({
            uri,
            name: data.name,
            sellerFeeBasisPoints: 500,
          })
          .run();
      };
    } catch (error) {
      console.error(error);
    }
  }

  const onSubmit = async (data: FormProps) => {
    await createNft(data);
  };

  const getRandomNft = async () => {
    const owner = mx.identity().publicKey;
    const nfts = (await mx
      .nfts()
      .findAllByOwner({ owner })
      .run()) as Metadata[];

    let randIdx = Math.floor(Math.random() * nfts.length);

    if (!nfts[randIdx]) {
      alert("Couldn't find NFTs");
      return;
    }
    const nftData = (await mx
      .nfts()
      .load({ metadata: nfts[randIdx] })
      .run()) as Nft;
    setNft(nftData);
  };

  if (!wallet.publicKey) {
    return (
      <div className="mx-auto p-4 md:hero">
        <div className="flex flex-col md:hero-content">
          <h1 className="bg-gradient-to-tr from-[#9945FF] to-[#14F195] bg-clip-text text-center text-5xl font-bold text-transparent">
            Wallet Not Connected
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto p-4 md:hero">
      <div className="flex flex-col md:hero-content">
        <h1 className="bg-gradient-to-tr from-[#9945FF] to-[#14F195] bg-clip-text text-center text-5xl font-bold text-transparent">
          Metaplex
        </h1>

        {/* Create NFT */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-control w-full max-w-xs">
            <label className="label">
              <span className="label-text">Name</span>
            </label>
            <input
              type="text"
              name="name"
              id="name"
              className="input input-bordered w-full max-w-xs"
              {...register("name", { required: true })}
            />
            {errors.name && <span>This field is required</span>}
            <label className="label">
              <span className="label-text">Description</span>
            </label>
            <input
              type="text"
              name="description"
              id="description"
              className="input input-bordered w-full max-w-xs"
              {...register("description", { required: true })}
            />
            {errors.description && <span>This field is required</span>}
            <label className="label">
              <span className="label-text">Image</span>
            </label>
            <input
              type="file"
              name="image"
              id="image"
              className="input input-bordered w-full max-w-xs"
              accept="image/jpeg, image/png, image/jpg"
              {...register("image", { required: true })}
            />
            {errors.image && <span>This field is required</span>}
            <div className="w-full pt-2">
              <button
                className="btn btn-primary w-full animate-pulse bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 "
                type="submit"
              >
                Submit
              </button>
            </div>
          </div>
        </form>

        {/* Pick Random NFT */}
        <button
          className="btn btn-primary w-full animate-pulse bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 "
          onClick={getRandomNft}
        >
          Pick Random NFT
        </button>
        <input
          type="text"
          className="input input-bordered w-full max-w-xs"
          value={nft ? nft.address.toBase58() : ""}
        />
        <div>
          {nft && (
            <div>
              <h1>{nft.name}</h1>
              <img
                src={nft.json.image || "/fallbackImage.jpg"}
                alt="The downloaded illustration of the provided NFT address."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
