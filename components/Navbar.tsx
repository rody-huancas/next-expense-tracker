import { checkUser } from "@/lib/checkUset";

export const Navbar = () => {
  const user = checkUser();

  return <div>Navbar</div>;
};
