import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/services/auth.service";

const STRONG_PASSWORD_MESSAGE =
  "Password minimal 8 karakter dan harus berisi huruf besar, huruf kecil, angka, serta simbol";
const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const formSchema = z
  .object({
    password: z
      .string()
      .min(1, "Password wajib diisi")
      .regex(STRONG_PASSWORD_REGEX, STRONG_PASSWORD_MESSAGE),
    password_confirmation: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    path: ["password_confirmation"],
    message: "Konfirmasi password tidak sama",
  });

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);

  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";
  const hasValidParams = useMemo(() => Boolean(email && token), [email, token]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      password_confirmation: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!hasValidParams) {
      setError("Link reset password tidak valid atau sudah rusak.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await resetPassword({
        email,
        token,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });
      navigate("/login", {
        replace: true,
        state: { message: "Password berhasil diperbarui. Silakan login." },
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "Gagal mengubah password. Link mungkin sudah kedaluwarsa.",
      );
    } finally {
      setIsLoading(false);
    }
  };

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

        <div className="mx-auto flex w-full max-w-[320px] flex-1 flex-col justify-center pb-12">
          <h1 className="mb-3 text-[22px] font-extrabold leading-none text-[#202638]">
            Reset Password
          </h1>
          <p className="mb-7 text-xs leading-relaxed text-[#64708b]">
            Buat password baru untuk akun {email || "Anda"}.
          </p>

          {!hasValidParams && (
            <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
              Link reset password tidak valid. Silakan ajukan ulang reset
              password.
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
              {error}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[15px] font-medium text-[#64708b]">
                      Password Baru
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="********"
                          className="h-[35px] rounded-[5px] border-[#dce3ec] bg-white px-3 pr-9 text-[11px] text-[#26324b] shadow-none placeholder:text-[#9aa7bd] focus-visible:ring-1 focus-visible:ring-emerald-600"
                          disabled={!hasValidParams}
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7c8aa3] transition-colors hover:text-emerald-700"
                          aria-label={
                            showPassword
                              ? "Sembunyikan password"
                              : "Tampilkan password"
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password_confirmation"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[15px] font-medium text-[#64708b]">
                      Konfirmasi Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={
                            showPasswordConfirmation ? "text" : "password"
                          }
                          placeholder="********"
                          className="h-[35px] rounded-[5px] border-[#dce3ec] bg-white px-3 pr-9 text-[11px] text-[#26324b] shadow-none placeholder:text-[#9aa7bd] focus-visible:ring-1 focus-visible:ring-emerald-600"
                          disabled={!hasValidParams}
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswordConfirmation((value) => !value)
                          }
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7c8aa3] transition-colors hover:text-emerald-700"
                          aria-label={
                            showPasswordConfirmation
                              ? "Sembunyikan password"
                              : "Tampilkan password"
                          }
                        >
                          {showPasswordConfirmation ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="mt-5 h-[29px] w-full rounded-[5px] bg-[#2f8f5c] text-[10px] font-bold uppercase tracking-wide text-white shadow-none transition-colors hover:bg-[#27794d]"
                disabled={isLoading || !hasValidParams}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Password"
                )}
              </Button>
            </form>
          </Form>

          <Link
            to="/login"
            className="mt-4 text-center text-xs font-medium text-[#64708b] hover:text-emerald-700"
          >
            Kembali ke halaman login
          </Link>
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
          <div className="max-w-[560px]">
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
