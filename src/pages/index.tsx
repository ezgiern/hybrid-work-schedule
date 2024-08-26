import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Kullanıcıyı login sayfasına yönlendir
    router.push("/login/page");
  }, []);
}
