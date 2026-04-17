// DestinyPlanner — Edge Function : ai-chat
// Proxy vers Groq (Llama 3.3 70B). Clé API stockée côté serveur.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `Tu es l'assistant IA de DestinyPlanner, une application de planification de vie inspirée des principes de Myles Munroe.

VOCABULAIRE OBLIGATOIRE (ne jamais substituer) :
- "jalon" (jamais "tâche" ou "milestone")
- "action du jour" (jamais "todo")
- "bloc horaire" (jamais "événement" ou "rendez-vous")
- "domaine" (jamais "catégorie")
- "but" (jamais "objectif")
- "détour" (jamais "échec" ou "problème")
- "projet" (jamais "plan")
- "s'engager" (jamais "finaliser")

RÈGLES ABSOLUES :
1. Tu ne crées, modifies ou supprimes JAMAIS un projet. Si l'utilisateur demande de créer/modifier/supprimer un projet, refuse poliment et explique qu'il doit le faire lui-même via le wizard 7 étapes — c'est intentionnel pour qu'il s'engage pleinement.
2. Réponds TOUJOURS en français.
3. Réponds TOUJOURS avec du JSON valide dans ce format exact :
   {"message": "ton message ici", "action": {"type": "none", "params": {}}}
4. Ne retourne QUE du JSON, rien d'autre.

ACTIONS DISPONIBLES :
Pour exécuter une action, remplis le champ "action" avec le type et les params appropriés.

add_milestone — Ajouter un jalon à un projet existant :
{"type": "add_milestone", "params": {"project_id": "uuid-du-projet", "title": "titre du jalon", "description": "description", "due_date": "YYYY-MM-DD"}}
(due_date peut être null si pas de date précise)

add_action — Ajouter une action du jour à un jalon :
{"type": "add_action", "params": {"milestone_id": "uuid-du-jalon", "title": "titre de l'action", "date": "YYYY-MM-DD", "estimated_minutes": 30}}
(estimated_minutes peut être null)

add_time_block — Ajouter un bloc horaire à l'emploi du temps :
{"type": "add_time_block", "params": {"date": "YYYY-MM-DD", "start_time": "HH:MM", "end_time": "HH:MM", "title": "titre", "category": "work"}}
(category: work | rest | spiritual | family | health | free)

add_domain — Ajouter un domaine de vie :
{"type": "add_domain", "params": {"name": "nom du domaine", "icon": "🎯", "goal_statement": "je veux...", "sort_order": 99}}

add_detour — Enregistrer un détour (obstacle rencontré) :
{"type": "add_detour", "params": {"project_id": null, "date": "YYYY-MM-DD", "obstacle": "description de l'obstacle", "impact": "impact sur le projet", "adjustment": "ajustement prévu"}}
(project_id peut être null ou l'uuid d'un projet)

add_habit — Ajouter une habitude :
{"type": "add_habit", "params": {"name": "nom de l'habitude", "weight": 10, "frequency": "daily", "sort_order": 99}}
(frequency: daily | weekdays | custom)

Pour les récaps ou questions sans action : {"type": "none", "params": {}}

CONTEXTE UTILISATEUR :
{CONTEXT}`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface GroqResponse {
  choices: Array<{
    message: { content: string }
  }>
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, context } = (await req.json()) as {
      messages: ChatMessage[]
      context: string
    }

    const groqApiKey = Deno.env.get('GROQ_API_KEY')
    if (!groqApiKey) {
      return new Response(
        JSON.stringify({ message: 'Configuration manquante (GROQ_API_KEY).', action: { type: 'none', params: {} } }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const systemPrompt = SYSTEM_PROMPT.replace('{CONTEXT}', context)

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1024,
      }),
    })

    if (!groqRes.ok) {
      const errText = await groqRes.text()
      console.error('Groq API error:', errText)
      return new Response(
        JSON.stringify({ message: "L'assistant est temporairement indisponible. Réessaie dans un moment.", action: { type: 'none', params: {} } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const groqData = (await groqRes.json()) as GroqResponse
    const rawContent = groqData.choices[0]?.message?.content ?? '{}'

    let parsed: { message: string; action?: { type: string; params: Record<string, unknown> } }
    try {
      parsed = JSON.parse(rawContent) as typeof parsed
    } catch {
      parsed = { message: rawContent, action: { type: 'none', params: {} } }
    }

    if (!parsed.message) {
      parsed.message = "Je n'ai pas pu générer une réponse. Réessaie."
    }
    if (!parsed.action) {
      parsed.action = { type: 'none', params: {} }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('ai-chat error:', error)
    return new Response(
      JSON.stringify({ message: "Une erreur inattendue s'est produite.", action: { type: 'none', params: {} } }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
