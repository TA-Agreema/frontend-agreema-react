import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserAuthForm from "@/components/auth/UserAuthForm";
import { useAuth } from "@/contexts/AuthContext";

export default function SignIn() {
  const { token, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && token) {
      navigate("/dashboard");
    }
  }, [token, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-sm text-slate-500">Memuat...</div>
      </div>
    );
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1fr_1fr]">
      <section className="relative flex min-h-screen flex-col px-6 py-6 sm:px-10 lg:px-14">
        <div className="flex items-start gap-2.5">
          <img
            src="/Agreema.svg"
            alt="Agreema"
            className="h-11 w-auto object-contain"
          />
        </div>

        <div className="mx-auto flex w-full max-w-[270px] flex-1 flex-col justify-center pb-12 sm:max-w-[310px] lg:max-w-[320px]">
          <h1 className="mb-7 text-[22px] font-extrabold leading-none text-[#202638]">
            Sign in
          </h1>
          <UserAuthForm />
        </div>
      </section>

      <section className="relative hidden min-h-screen overflow-hidden lg:block">
        <img
          src="/imageLogin.png"
          alt="Ruang kerja Agreema"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-emerald-700/78" />
        <div className="relative z-10 flex h-full items-center justify-center px-18 text-center text-white">
          <div className="max-w-[560px] translate-y-0">
            <h2 className="whitespace-nowrap text-[40px] font-extrabold leading-tight">
              Halo, Selamat Datang!
            </h2>
            <p className="mx-auto mt-3 max-w-[390px] text-[18px] font-medium leading-relaxed text-white/90">
              Kelola, pantau, dan amankan seluruh kontrak dalam satu platform
              terintegrasi.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
