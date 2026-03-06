import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Sun } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import logoPath from "@/assets/randoli-solar-logo.png";

const loginSchema = z.object({
  username: z.string().min(1, "Informe o usuário"),
  password: z.string().min(1, "Informe a senha"),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginForm) =>
      apiRequest("POST", "/api/auth/login", data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      navigate("/");
    },
    onError: (error: any) => {
      setErrorMsg(error.message || "Usuário ou senha inválidos");
    },
  });

  const onSubmit = (data: LoginForm) => {
    setErrorMsg("");
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gray-900 px-8 py-8 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center mb-4 overflow-hidden">
              <img src={logoPath} alt="Randoli Solar" className="w-full h-full object-contain p-1" />
            </div>
            <h1 className="text-white font-bold text-lg tracking-widest">RANDOLI SOLAR</h1>
            <p className="text-gray-400 text-xs tracking-wider mt-1">SISTEMA DE GESTÃO</p>
          </div>

          <div className="px-8 py-8">
            <div className="flex items-center gap-2 mb-6">
              <Sun className="w-4 h-4 text-primary" />
              <h2 className="text-foreground font-semibold text-sm tracking-wide">ENTRAR NA SUA CONTA</h2>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold tracking-wider text-muted-foreground">USUÁRIO</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          data-testid="input-username"
                          placeholder="seu.usuario"
                          autoCapitalize="none"
                          autoComplete="username"
                          className="h-10 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold tracking-wider text-muted-foreground">SENHA</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            data-testid="input-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className="h-10 text-sm pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {errorMsg && (
                  <div data-testid="error-login" className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">
                    {errorMsg}
                  </div>
                )}

                <Button
                  type="submit"
                  data-testid="button-entrar"
                  className="w-full h-10 font-bold tracking-widest text-sm mt-2"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "ENTRANDO..." : "ENTRAR"}
                </Button>
              </form>
            </Form>
          </div>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          © {new Date().getFullYear()} Randoli Solar — Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}
