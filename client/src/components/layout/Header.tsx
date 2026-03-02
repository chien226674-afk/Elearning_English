import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShop} from "@fortawesome/free-solid-svg-icons";
import {faUser} from "@fortawesome/free-regular-svg-icons"
import { Button } from "../ui/button";


function Header() {
    return (<div className="flex justify-between pt-7.5 ml-12.5">
            <div className="flex items-center ml-5 text-[#ffffff]  cursor-pointer text-2xl">
                <button className="cursor-pointer"><FontAwesomeIcon icon={faShop}/></button>
               <h1 className="font-mono font-medium ml-2">NFT Marketplace</h1>
            </div>
            <div className="text-2xl">
                <Button  variant="ghost" >Marketplace</Button>
                <Button  variant="ghost">Ranking</Button>
                <Button  variant="ghost">Connect a Wallet</Button>
                <Button  variant="primary" className="mr-12.5"><FontAwesomeIcon icon={faUser} /> Sign Up</Button>
            </div>
    </div>  );
}

export default Header;