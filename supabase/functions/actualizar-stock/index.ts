import { serve } from "@std/http/server"
import { supabaseAdmin } from "../_shared/supabase.ts"

serve(async (req: Request) => {
  try {
    // 1. Recibir los datos del Webhook que nos mandará la base de datos
    const payload = await req.json()

    // 2. Validar que la acción sea crear (INSERT) un nuevo servicio
    if (payload.type === 'INSERT' && payload.table === 'servicios') {
      const urnaId = payload.record.urna_id

      if (urnaId) {
        // 3. Consultar el stock actual de esa urna
        const { data: urna, error: fetchError } = await supabaseAdmin
          .from('urnas')
          .select('stock_actual')
          .eq('id', urnaId)
          .single()

        if (fetchError) throw fetchError

        // 4. Si hay stock, descontamos 1 unidad
        if (urna && urna.stock_actual > 0) {
          const { error: updateError } = await supabaseAdmin
            .from('urnas')
            .update({ stock_actual: urna.stock_actual - 1 })
            .eq('id', urnaId)

          if (updateError) throw updateError
        }
      }
    }

    // 5. Responder que todo salió bien
    return new Response(JSON.stringify({ success: true, message: "Stock actualizado" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    // Verificamos si el error es un objeto de tipo Error tradicional
    const errorMessage = error instanceof Error ? error.message : String(error)

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    })
  }
})