import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, User, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { lovable } from "@/integrations/lovable/index";

const Auth = () => {
  const { signIn, signUp } = useAuth();
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ email: "", password: "", first_name: "", last_name: "" });
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setOauthLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result?.error) {
      toast({ title: "Erreur Google", description: String(result.error), variant: "destructive" });
    }
    setOauthLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(loginForm.email, loginForm.password);
    setLoading(false);
    if (error) {
      toast({ title: "Erreur de connexion", description: error.message, variant: "destructive" });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupForm.password.length < 6) {
      toast({ title: "Erreur", description: "Le mot de passe doit contenir au moins 6 caractères", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await signUp(signupForm.email, signupForm.password, {
      first_name: signupForm.first_name,
      last_name: signupForm.last_name,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erreur d'inscription", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Inscription réussie", description: "Vérifiez votre email pour confirmer votre compte." });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center mb-4">
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold font-display">Cockpit Comptable</h1>
          <p className="text-sm text-muted-foreground mt-1">EPLE • GRETA • CFA</p>
        </div>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            <Tabs defaultValue="login">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="login" className="flex-1">Connexion</TabsTrigger>
                <TabsTrigger value="signup" className="flex-1">Inscription</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="email" placeholder="agent@ac-versailles.fr" className="pl-10" required
                        value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="password" placeholder="••••••••" className="pl-10" required
                        value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full gradient-primary border-0" disabled={loading}>
                    {loading ? "Connexion..." : "Se connecter"} <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Prénom</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Jean" className="pl-10" required
                          value={signupForm.first_name} onChange={(e) => setSignupForm({ ...signupForm, first_name: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <Label>Nom</Label>
                      <Input placeholder="Dupont" required
                        value={signupForm.last_name} onChange={(e) => setSignupForm({ ...signupForm, last_name: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="email" placeholder="agent@ac-versailles.fr" className="pl-10" required
                        value={signupForm.email} onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="password" placeholder="Min. 6 caractères" className="pl-10" required
                        value={signupForm.password} onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full gradient-primary border-0" disabled={loading}>
                    {loading ? "Inscription..." : "S'inscrire"} <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
