// DestinyPlanner — Supabase Edge Function : push-notify
// Reçoit { userId, title, body }, envoie une notification push via VAPID

import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, title, body } = (await req.json()) as {
      userId: string
      title: string
      body: string
    }

    if (!userId || !title) {
      return new Response(JSON.stringify({ error: 'userId et title requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Variables d'environnement (Supabase Secrets)
    const vapidPublicKey  = Deno.env.get('VAPID_PUBLIC_KEY')!
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!
    const vapidSubject    = Deno.env.get('VAPID_SUBJECT')!

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

    // Client Supabase admin (service role)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: sub, error } = await supabase
      .from('user_push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !sub) {
      return new Response(JSON.stringify({ error: 'Souscription introuvable' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    }

    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify({ title, body }),
      { TTL: 60 * 60 * 24 } // 24h max
    )

    return new Response(JSON.stringify({ sent: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
