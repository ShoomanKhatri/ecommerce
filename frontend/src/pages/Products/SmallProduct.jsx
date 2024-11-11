import { Link } from "react-router-dom";
import HeartIcon from "./HeartIcon";

const SmallProduct = ({ product }) => {
  return (
    <div className="w-[20rem] ml-[2rem] p-2">
      <div className="relative">
        <img
  
          src={product.image}
          alt={product.name}
          className="mx-auto ml-10 w-[256px] h-[208px] cover rounded"
        />
        <HeartIcon product={product} />
      </div>

      <div className="ml-20 p-5">
        <Link to={`/product/${product._id}`}>
          <h2 className="flex justify-between items-center">
            <div>{product.name}</div>
            <span className="bg-pink-100 text-pink-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-pink-300">
              Rs{product.price}
            </span>
          </h2>
        </Link>
      </div>
    </div>
  );
};

export default SmallProduct;
