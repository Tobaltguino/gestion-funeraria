// deno-lint-ignore no-import-prefix
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// deno-lint-ignore no-import-prefix
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { nombre, rut, email, password, rol, telefono } = await req.json();

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password, 
      email_confirm: true 
    });

    if (authError) throw authError;

    const userId = authData.user.id;

    const { error: dbError } = await supabaseAdmin
      .from('usuarios')
      .insert([
        {
          id: userId,
          nombre: nombre,
          rut: rut,       
          rol: rol,
          telefono: telefono,
          activo: true    
        }
      ]);

    if (dbError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw dbError;
    }

    return new Response(
      JSON.stringify({ mensaje: 'Usuario creado exitosamente', usuario: authData.user }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      }
    );

  } catch (error: unknown) { 
    // TypeScript nos pide verificar si realmente es un objeto de Error antes de leer su mensaje
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear usuario';
    
    console.error('Error en Edge Function:', errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    );
  }
});