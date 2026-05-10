import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from '@supabase/supabase-js';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logError = (route: string, err: any) => {
  const msg = `${new Date().toISOString()} [${route}] ERROR: ${JSON.stringify(err)}\n`;
  fs.appendFileSync(path.join(__dirname, 'wqaft_error.log'), msg);
};

const app = express();
const PORT = Number(process.env.PORT) || 3005;
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_2024";

const supabaseUrl = process.env.SUPABASE_URL || "https://tgzrlezinixdnrnjuprc.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ Supabase connection successful');
  } catch (err) {
    console.error('❌ Supabase connection failed:', err);
  }
}
testSupabaseConnection();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

const authMiddleware = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

async function fetchUsers(ids: string[]) {
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from('users')
    .select('id, first_name, last_name, phone, email, role, address, vehicle_type, rating, total_reviews, photo, city, created_at')
    .in('id', ids);

  if (error && error.message?.includes('photo')) {
    const retry = await supabase
      .from('users')
      .select('id, first_name, last_name, phone, email, role, address, vehicle_type, rating, total_reviews, city, created_at')
      .in('id', ids);
    return retry.data || [];
  }

  const formattedData = (data || []).map((user: any) => ({
    ...user,
    name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email?.split('@')[0] || 'Utilisateur',
    vehicle: user.vehicle_type,
    vehicle_info: user.vehicle_type ? { type: user.vehicle_type } : null
  }));

  return formattedData || [];
}

const apiRouter = express.Router();
const authRouter = express.Router();

// ── AUTH ─────────────────────────────────────────────────────

authRouter.post("/register", async (req, res) => {
  const { email, password, name, role, phone, city, vehicle, vehicle_info, experience, years_experience, specialties, specialty, garage_name, photo, first_name, last_name } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    let firstName = first_name;
    let lastName = last_name;
    if (name && !firstName && !lastName) {
      const nameParts = name.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    const { data, error } = await supabase.from('users').insert([{
      email, 
      encrypted_password: hashedPassword,
      password: hashedPassword,
      first_name: firstName || name,
      last_name: lastName || '',
      role: role || 'automobiliste', 
      phone, 
      city,
      vehicle_type: vehicle || (vehicle_info?.type),
      experience: experience || years_experience,
      specialties: specialties || specialty,
      garage_name, 
      photo,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }]).select().single();

    if (error) throw error;

    const formattedUser = {
      ...data,
      name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.email?.split('@')[0]
    };

    const token = jwt.sign({ id: data.id, role: data.role }, JWT_SECRET);
    res.status(201).json({ token, user: formattedUser });
  } catch (error: any) {
    console.error("Register error:", error);
    res.status(400).json({ error: error.message });
  }
});

authRouter.post("/login", async (req, res) => {
  const { email, identifier, password } = req.body;
  const loginId = (identifier || email || '').trim();
  console.log(`[AUTH] Login attempt for: ${loginId}`);

  if (!loginId || !password) {
    return res.status(400).json({ error: "Identifiant et mot de passe requis" });
  }

  try {
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', loginId)
      .maybeSingle();

    if (!user && !error) {
      const phoneResult = await supabase
        .from('users')
        .select('*')
        .eq('phone', loginId)
        .maybeSingle();

      if (!phoneResult.error || phoneResult.error.code !== '42703') {
        user = phoneResult.data;
      }
    }

    if (!user) {
      return res.status(401).json({ error: "Utilisateur non trouvé" });
    }

    let valid = false;
    if (user.encrypted_password) {
      valid = await bcrypt.compare(password, user.encrypted_password);
    } else if (user.password) {
      valid = await bcrypt.compare(password, user.password);
    }

    if (!valid) {
      return res.status(401).json({ error: "Mot de passe incorrect" });
    }

    const formattedUser = {
      ...user,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email?.split('@')[0],
      vehicle: user.vehicle_type
    };

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    res.json({ token, user: formattedUser });

  } catch (err: any) {
    console.error("[AUTH] Database error:", err);
    res.status(500).json({ error: "Erreur de connexion" });
  }
});

apiRouter.use("/auth", authRouter);

// ── USER ─────────────────────────────────────────────────────

apiRouter.get("/user/profile", authMiddleware, async (req: any, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*').eq('id', req.user.id).single();
    if (error) throw error;

    const formattedUser = {
      ...data,
      name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.email?.split('@')[0],
      vehicle: data.vehicle_type
    };

    res.json({ user: formattedUser });
  } catch {
    res.status(404).json({ error: "Profil non trouve" });
  }
});

// Route pour accepter/refuser une offre (version avec demande_id)
apiRouter.post("/demandes/:id/respond", authMiddleware, async (req: any, res) => {
  const { action, offer_id } = req.body;
  const demandeId = req.params.id;
  
  console.log(`[DEMANDE RESPOND] Demande: ${demandeId}, Offer: ${offer_id}, Action: ${action}, User: ${req.user.id}`);
  
  try {
    // 1. Récupérer l'offre avec les détails
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('*, demande:demande_id(*)')
      .eq('id', offer_id)
      .single();

    if (offerError || !offer) {
      console.error("Offer not found:", offerError);
      return res.status(404).json({ error: "Offre non trouvée" });
    }

    // 2. Vérifier que l'utilisateur est bien le client
    if (offer.demande?.client_id !== req.user.id) {
      console.error("Unauthorized: Client mismatch");
      return res.status(403).json({ error: "Non autorisé" });
    }

    // 3. Vérifier que l'offre est encore en attente
    if (offer.status !== 'pending') {
      console.error("Offer already processed:", offer.status);
      return res.status(400).json({ error: "Cette offre a déjà été traitée" });
    }

    if (action === 'accept') {
      // Accepter l'offre
      await supabase.from('offers').update({ status: 'accepted' }).eq('id', offer_id);
      
      // Refuser toutes les autres offres
      await supabase.from('offers').update({ status: 'refused' }).eq('demande_id', demandeId).neq('id', offer_id);
      
      // Marquer la demande comme assignée
      await supabase.from('demandes').update({ status: 'assigned' }).eq('id', demandeId);
      
      // Créer l'intervention
      const { data: intervention } = await supabase.from('interventions').insert({
        demande_id: demandeId,
        mecanicien_id: offer.mecanicien_id,
        client_id: req.user.id,
        final_price: offer.price,
        status: 'ongoing',
        date_started: new Date().toISOString()
      }).select().single();

      // Envoyer un message automatique
      await supabase.from('messages').insert({
        sender_id: req.user.id,
        receiver_id: offer.mecanicien_id,
        content: `💰 Intervention acceptée pour ${offer.price} MAD. Le mécanicien va vous contacter.`,
        created_at: new Date().toISOString()
      });

      console.log("Offer accepted successfully");
      res.json({ success: true, action: 'accepted', intervention });
    } 
    else if (action === 'refuse') {
      // Refuser l'offre
      await supabase.from('offers').update({ status: 'refused' }).eq('id', offer_id);
      
      // Envoyer un message au mécanicien
      await supabase.from('messages').insert({
        sender_id: req.user.id,
        receiver_id: offer.mecanicien_id,
        content: `❌ Votre proposition de ${offer.price} MAD a été refusée.`,
        created_at: new Date().toISOString()
      });

      console.log("Offer refused successfully");
      res.json({ success: true, action: 'refused' });
    }
    else {
      res.status(400).json({ error: "Action non reconnue. Utilisez 'accept' ou 'refuse'" });
    }
  } catch (error: any) {
    console.error("POST /demandes/:id/respond error:", error);
    res.status(500).json({ error: error.message });
  }
});

apiRouter.put("/user/profile", authMiddleware, async (req: any, res) => {
  const { name, first_name, last_name, phone, city, address, vehicle_info, specialty, garage_name, vehicle_type } = req.body;
  try {
    let firstName = first_name;
    let lastName = last_name;
    if (name && !firstName && !lastName) {
      const nameParts = name.split(' ');
      firstName = nameParts[0];
      lastName = nameParts.slice(1).join(' ');
    }

    const { data, error } = await supabase.from('users').update({
      first_name: firstName,
      last_name: lastName,
      phone,
      city,
      address,
      vehicle_type: vehicle_type || vehicle_info?.type,
      specialties: specialty,
      garage_name,
      updated_at: new Date().toISOString()
    }).eq('id', req.user.id).select().single();

    if (error) throw error;

    const formattedUser = {
      ...data,
      name: `${data.first_name || ''} ${data.last_name || ''}`.trim()
    };

    res.json({ user: formattedUser });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

apiRouter.get("/user/profile/:id", authMiddleware, async (req: any, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*').eq('id', req.params.id).single();
    if (error) throw error;

    const formattedUser = {
      ...data,
      name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.email?.split('@')[0],
      vehicle: data.vehicle_type
    };

    res.json({ user: formattedUser });
  } catch {
    res.status(404).json({ error: "Profil non trouve" });
  }
});

apiRouter.post("/user/photo", authMiddleware, async (req: any, res) => {
  const { photoBase64 } = req.body;
  if (!photoBase64) return res.status(400).json({ error: "No photo provided" });
  try {
    const buffer = Buffer.from(photoBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
    const fileName = `profile-${req.user.id}-${Date.now()}.png`;
    const { error } = await supabase.storage.from('images').upload(fileName, buffer, { contentType: 'image/png', upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
    await supabase.from('users').update({ photo: publicUrl }).eq('id', req.user.id);
    res.json({ photo: publicUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get("/mechanics", authMiddleware, async (req: any, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*').neq('id', req.user?.id);
    if (error) throw error;
    const filtered = (data || [])
      .filter((u: any) => {
        const isPro = u.role && !['automobiliste', 'driver', 'client'].includes((u.role || '').toLowerCase());
        return isPro || u.specialties || u.vehicle_type || u.garage_name;
      })
      .map((u: any) => ({
        id: u.id,
        name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Pro',
        photo: u.photo || null,
        phone: u.phone || '',
        city: u.city || '',
        specialties: u.specialties || u.vehicle_type || 'Mecanicien',
        mecanicien_type: u.garage_name || 'Garage',
        address: u.address || u.city || 'Marrakech',
        rating: u.rating || 4.5,
        role: u.role
      }));
    res.json(filtered);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── MESSAGES ─────────────────────────────────────────────────

apiRouter.get("/messages/unread-count", (req, res) => res.json({ count: 0 }));

async function findMessageColumn() {
  const { data, error } = await supabase.from('messages').select('*').limit(1);
  if (error || !data || !data[0]) return 'receiver_id';
  if ('to_user_id' in data[0]) return 'to_user_id';
  if ('recipient_id' in data[0]) return 'recipient_id';
  if ('receiver_id' in data[0]) return 'receiver_id';
  return 'demande_id';
}

apiRouter.get("/messages/conversations", authMiddleware, async (req: any, res) => {
  try {
    const col = await findMessageColumn();
    const me = String(req.user.id);

    const { data: allMessages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${me},${col}.eq.${me}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!allMessages?.length) return res.json([]);

    const conversationsMap = new Map<string, any>();
    const contactIds = new Set<string>();

    allMessages.forEach((msg: any) => {
      const s = String(msg.sender_id || '');
      const r = String(msg[col] || '');
      const contactId = s === me ? r : s;
      if (contactId && contactId !== me) {
        contactIds.add(contactId);
        if (!conversationsMap.has(contactId)) {
          conversationsMap.set(contactId, msg);
        }
      }
    });

    const users = await fetchUsers(Array.from(contactIds));
    const userMap = new Map(users.map((u: any) => [String(u.id), u]));

    const result = Array.from(conversationsMap.entries()).map(([id, msg]) => {
      const contact = userMap.get(id);
      return {
        id,
        name: contact?.name || 'Utilisateur',
        photo: contact?.photo || null,
        last: msg.content || msg.message || '',
        time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date(msg.created_at).getTime(),
        unread: false
      };
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get("/messages/:contactId", authMiddleware, async (req: any, res) => {
  try {
    const col = await findMessageColumn();
    const me = String(req.user.id);
    const contact = String(req.params.contactId);

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${me},${col}.eq.${contact}),and(sender_id.eq.${contact},${col}.eq.${me})`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const thread = (data || []).map((msg: any) => ({
      id: msg.id,
      fromMe: String(msg.sender_id || '') === me,
      text: msg.content || msg.message || '',
      time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date(msg.created_at).getTime()
    }));
    res.json(thread);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post("/messages", authMiddleware, async (req: any, res) => {
  const { receiver_id, message, to_user_id, photo } = req.body;
  const targetId = receiver_id || to_user_id;
  try {
    const col = await findMessageColumn();
    const payload: any = {
      sender_id: req.user.id,
      content: message || (photo ? "📷 Photo partagée" : ""),
      created_at: new Date().toISOString()
    };
    if (photo) {
      payload.photo_url = photo; // Stocker l'URL de la photo
      payload.message_type = 'photo';
    }
    payload[col] = targetId;

    const { data, error } = await supabase.from('messages').insert([payload]).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    console.error("[MESSAGES] Error:", error);
    res.status(400).json({ error: error.message });
  }
});

apiRouter.put("/messages/read-all/:contactId", authMiddleware, async (req: any, res) => res.json({ success: true }));

// ── REVIEWS ──────────────────────────────────────────────────

apiRouter.post("/reviews", authMiddleware, async (req: any, res) => {
  const { mechanic_id, rating, comment } = req.body;
  try {
    const { error } = await supabase.from('reviews').insert([{ reviewer_id: req.user.id, reviewed_id: mechanic_id, rating, comment, created_at: new Date().toISOString() }]);
    if (error) throw error;
    res.status(201).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── DEMANDES ─────────────────────────────────────────

apiRouter.post("/demandes", authMiddleware, async (req: any, res) => {
  const { category, description, lat, lng, photo, address, vehicle_info } = req.body;
  try {
    // Vérifier si l'utilisateur a déjà une demande active (moins de 5 min)
    const { data: existingDemande } = await supabase
      .from('demandes')
      .select('id, created_at')
      .eq('client_id', req.user.id)
      .eq('status', 'open')
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .maybeSingle();

    if (existingDemande) {
      return res.status(400).json({ 
        error: "Vous avez déjà une demande en cours. Veuillez attendre 5 minutes.",
        remainingTime: 300 - Math.floor((Date.now() - new Date(existingDemande.created_at).getTime()) / 1000)
      });
    }

    let imageUrl = null;
    if (photo && photo.startsWith('data:image')) {
      const buffer = Buffer.from(photo.replace(/^data:image\/\w+;base64,/, ""), 'base64');
      const fileName = `panne-${req.user.id}-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage.from('images').upload(fileName, buffer, { contentType: 'image/png' });
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }
    }

    const { data, error } = await supabase.from('demandes').insert({
      client_id: req.user.id,
      description: `${category}: ${description || ''}`,
      category: category,
      photo_path: imageUrl,
      status: 'open',
      lat: lat || null,
      lng: lng || null,
      address: address,
      vehicle_info: vehicle_info,
      created_at: new Date().toISOString()
    }).select().single();
    
    if (error) throw error;
    res.status(201).json({ success: true, data, remainingTime: 300 });
  } catch (error: any) { 
    console.error("POST /demandes error:", error);
    res.status(500).json({ error: error.message }); 
  }
});

// Route pour vérifier si l'utilisateur peut publier (timer)
apiRouter.get("/demandes/can-publish", authMiddleware, async (req: any, res) => {
  try {
    const { data: lastDemande } = await supabase
      .from('demandes')
      .select('created_at')
      .eq('client_id', req.user.id)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lastDemande) {
      return res.json({ canPublish: true, remainingTime: 0 });
    }

    const timeElapsed = (Date.now() - new Date(lastDemande.created_at).getTime()) / 1000;
    const remainingTime = Math.max(0, 300 - timeElapsed);
    const canPublish = remainingTime === 0;

    res.json({ canPublish, remainingTime: Math.ceil(remainingTime) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour récupérer les demandes disponibles (mécanicien)
apiRouter.get("/demandes/available", authMiddleware, async (req: any, res) => {
  try {
    if (req.user.role !== 'mecanicien') {
      return res.status(403).json({ error: "Accès réservé aux mécaniciens" });
    }

    const { data, error } = await supabase
      .from('demandes')
      .select(`
        *,
        client:client_id (
          id,
          first_name,
          last_name,
          phone,
          photo,
          vehicle_type,
          rating
        )
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (data || []).map((demande: any) => ({
      ...demande,
      client: demande.client ? {
        ...demande.client,
        name: `${demande.client.first_name || ''} ${demande.client.last_name || ''}`.trim(),
        vehicle: demande.client.vehicle_type
      } : null,
      timeSince: Math.floor((Date.now() - new Date(demande.created_at).getTime()) / 60000) + " min"
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get("/demandes", authMiddleware, async (req: any, res) => {
  try {
    let query = supabase
      .from('demandes')
      .select('*');

    if (req.user.role === 'automobiliste') query = query.eq('client_id', req.user.id);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    const leads = data || [];
    const ownerIds = [...new Set(leads.map((l: any) => String(l.client_id)).filter(Boolean))];
    const usersData = ownerIds.length ? await fetchUsers(ownerIds) : [];
    const userMap = new Map(usersData.map((u: any) => [String(u.id), u]));

    const normalized = leads.map((lead: any) => ({
      ...lead,
      owner_id: lead.client_id,
      client: userMap.get(String(lead.client_id)) || { name: 'Automobiliste', phone: '' },
      photo: lead.photo_path,
      image_url: lead.photo_path
    }));
    res.json(normalized);
  } catch (error: any) {
    console.error("GET /demandes error:", error);
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get("/demandes/count", authMiddleware, async (req: any, res) => {
  try {
    const { count, error } = await supabase
      .from('demandes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');
    if (error) throw error;
    res.json({ count: count || 0 });
  } catch (err: any) {
    console.error("Demandes count error:", err);
    res.json({ count: 0 });
  }
});

// ── OFFERS ─────────────────────────────────────────

apiRouter.get("/offers/count", authMiddleware, async (req: any, res) => {
  try {
    const { data: myDemandes } = await supabase
      .from('demandes')
      .select('id')
      .eq('client_id', req.user.id);

    const demandeIds = (myDemandes || []).map((l: any) => l.id);
    if (!demandeIds.length) {
      return res.json({ count: 0 });
    }

    const { count, error } = await supabase
      .from('offers')
      .select('*', { count: 'exact', head: true })
      .in('demande_id', demandeIds)
      .eq('status', 'pending');

    if (error) {
      console.error("Count error:", error);
      return res.json({ count: 0 });
    }

    res.json({ count: count || 0 });
  } catch (err: any) {
    console.error("Offers count error:", err);
    res.json({ count: 0 });
  }
});

apiRouter.get("/offers", authMiddleware, async (req: any, res) => {
  try {
    // Récupérer les demandes du client
    const { data: myDemandes } = await supabase
      .from('demandes')
      .select('id')
      .eq('client_id', req.user.id);

    const demandeIds = (myDemandes || []).map((l: any) => l.id);
    if (!demandeIds.length) {
      return res.json([]);
    }

    // Requête directe sur la table offers avec jointure
    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        mechanic:mecanicien_id (
          id,
          first_name,
          last_name,
          phone,
          photo,
          rating,
          address,
          city
        )
      `)
      .in('demande_id', demandeIds)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Offers fetch error:", error);
      return res.status(500).json({ error: error.message });
    }

    // Formater les données
    const formatted = (data || []).map((offer: any) => ({
      ...offer,
      mechanic: offer.mechanic ? {
        ...offer.mechanic,
        name: `${offer.mechanic.first_name || ''} ${offer.mechanic.last_name || ''}`.trim()
      } : null
    }));

    res.json(formatted);
  } catch (error: any) {
    console.error("GET /offers error:", error);
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get("/offers/mine", authMiddleware, async (req: any, res) => {
  try {
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('mecanicien_id', req.user.id);

    if (error) throw error;

    const demandeIds = [
      ...new Set((data || []).map((o: any) => o.demande_id).filter(Boolean))
    ];

    if (demandeIds.length) {
      const { data: demandes } = await supabase
        .from('demandes')
        .select('*')
        .in('id', demandeIds);

      const demandeMap = new Map(demandes?.map((d: any) => [d.id, d]));
      const enriched = (data || []).map((offer: any) => ({
        ...offer,
        demande: demandeMap.get(offer.demande_id)
      }));

      return res.json(enriched);
    }

    res.json(data || []);
  } catch (error: any) {
    console.error("GET /offers/mine error:", error);
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post("/offers", authMiddleware, async (req: any, res) => {
  const { demande_id, price, message } = req.body;
  try {
    // Vérifier que c'est un mécanicien
    if (req.user.role !== 'mecanicien') {
      return res.status(403).json({ error: "Seuls les mécaniciens peuvent faire des propositions" });
    }

    // Vérifier que la demande existe et est encore ouverte
    const { data: demande, error: demandeError } = await supabase
      .from('demandes')
      .select('id, client_id, status, created_at')
      .eq('id', demande_id)
      .single();

    if (demandeError || !demande) {
      return res.status(404).json({ error: "Demande non trouvée" });
    }

    if (demande.status !== 'open') {
      return res.status(400).json({ error: "Cette demande n'est plus disponible" });
    }

    // Vérifier les 5 minutes
    const timeElapsed = (Date.now() - new Date(demande.created_at).getTime()) / 1000;
    if (timeElapsed > 300) {
      await supabase.from('demandes').update({ status: 'expired' }).eq('id', demande_id);
      return res.status(400).json({ error: "Le délai de 5 minutes est dépassé" });
    }

    // Vérifier si le mécanicien a déjà proposé un prix refusé sur cette demande
    const { data: previousOffer } = await supabase
      .from('offers')
      .select('status')
      .eq('demande_id', demande_id)
      .eq('mecanicien_id', req.user.id)
      .eq('status', 'refused')
      .maybeSingle();

    if (previousOffer) {
      return res.status(400).json({ error: "Vous avez déjà fait une proposition refusée sur cette demande" });
    }

    const { data, error } = await supabase.from('offers').insert({
      demande_id: demande_id,
      mecanicien_id: req.user.id,
      price: price,
      message: message || `Proposition de ${price} MAD`,
      status: 'pending',
      created_at: new Date().toISOString()
    }).select(`
      *,
      mechanic:mecanicien_id (
        id,
        first_name,
        last_name,
        phone,
        photo,
        rating
      )
    `).single();

    if (error) throw error;

    // Formater la réponse
    const formatted = {
      ...data,
      mechanic: data.mechanic ? {
        ...data.mechanic,
        name: `${data.mechanic.first_name || ''} ${data.mechanic.last_name || ''}`.trim()
      } : null
    };

    res.status(201).json(formatted);
  } catch (error: any) {
    console.error("POST /offers error:", error);
    res.status(400).json({ error: error.message });
  }
});

/// Route pour accepter/refuser une offre
apiRouter.post("/offers/:id/respond", authMiddleware, async (req: any, res) => {
  const { action } = req.body;
  const offerId = req.params.id;
  
  console.log(`[OFFER RESPOND] Offer: ${offerId}, Action: ${action}, User: ${req.user.id}`);
  
  try {
    // 1. Récupérer l'offre avec les détails
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('*, demande:demande_id(*)')
      .eq('id', offerId)
      .single();

    if (offerError || !offer) {
      console.error("Offer not found:", offerError);
      return res.status(404).json({ error: "Offre non trouvée" });
    }

    console.log("Offer found:", { 
      offerId: offer.id, 
      clientId: offer.demande?.client_id, 
      userId: req.user.id,
      status: offer.status 
    });

    // 2. Vérifier que l'utilisateur est bien le client
    if (offer.demande?.client_id !== req.user.id) {
      console.error("Unauthorized: Client mismatch");
      return res.status(403).json({ error: "Non autorisé" });
    }

    // 3. Vérifier que l'offre est encore en attente
    if (offer.status !== 'pending') {
      console.error("Offer already processed:", offer.status);
      return res.status(400).json({ error: "Cette offre a déjà été traitée" });
    }

    if (action === 'accept') {
      // 4. Accepter l'offre
      const { error: updateOfferError } = await supabase
        .from('offers')
        .update({ status: 'accepted' })
        .eq('id', offerId);
      
      if (updateOfferError) throw updateOfferError;
      
      // 5. Refuser toutes les autres offres sur cette demande
      const { error: refuseOthersError } = await supabase
        .from('offers')
        .update({ status: 'refused' })
        .eq('demande_id', offer.demande_id)
        .neq('id', offerId);
      
      if (refuseOthersError) throw refuseOthersError;
      
      // 6. Marquer la demande comme assignée
      const { error: updateDemandeError } = await supabase
        .from('demandes')
        .update({ status: 'assigned' })
        .eq('id', offer.demande_id);
      
      if (updateDemandeError) throw updateDemandeError;
      
      // 7. Créer l'intervention
      const { data: intervention, error: interventionError } = await supabase
        .from('interventions')
        .insert({
          demande_id: offer.demande_id,
          mecanicien_id: offer.mecanicien_id,
          client_id: req.user.id,
          final_price: offer.price,
          status: 'ongoing',
          date_started: new Date().toISOString()
        })
        .select()
        .single();

      if (interventionError) {
        console.error("Intervention creation error:", interventionError);
        // Continue quand même même si l'intervention échoue
      }

      // 8. Envoyer un message automatique
      await supabase.from('messages').insert({
        sender_id: req.user.id,
        receiver_id: offer.mecanicien_id,
        content: `💰 Intervention acceptée pour ${offer.price} MAD. Le mécanicien va vous contacter.`,
        created_at: new Date().toISOString()
      });

      console.log("Offer accepted successfully");
      res.json({ success: true, action: 'accepted', intervention });

    } 
    else if (action === 'refuse') {
      // Refuser l'offre
      const { error: updateOfferError } = await supabase
        .from('offers')
        .update({ status: 'refused' })
        .eq('id', offerId);
      
      if (updateOfferError) throw updateOfferError;
      
      // Envoyer un message au mécanicien
      await supabase.from('messages').insert({
        sender_id: req.user.id,
        receiver_id: offer.mecanicien_id,
        content: `❌ Votre proposition de ${offer.price} MAD a été refusée.`,
        created_at: new Date().toISOString()
      });

      console.log("Offer refused successfully");
      res.json({ success: true, action: 'refused' });
    }
    else {
      res.status(400).json({ error: "Action non reconnue. Utilisez 'accept' ou 'refuse'" });
    }
  } catch (error: any) {
    console.error("POST /offers/:id/respond error:", error);
    res.status(500).json({ error: error.message, details: error.details });
  }
});

// ── INTERVENTIONS ─────────────────────────────────────────────────

apiRouter.get("/interventions", authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const isMec = req.user.role === 'mecanicien';

    let query = supabase.from('interventions').select('*');
    if (isMec) {
      query = query.eq('mecanicien_id', userId);
    } else {
      const { data: myDemandes } = await supabase.from('demandes').select('id').eq('client_id', userId);
      const demandeIds = (myDemandes || []).map(d => d.id);
      if (!demandeIds.length) return res.json([]);
      query = query.in('demande_id', demandeIds);
    }

    const { data: interventions, error } = await query.order('date_started', { ascending: false });
    if (error) throw error;
    if (!interventions?.length) return res.json([]);

    const demandeIds = [...new Set(interventions.map((p: any) => String(p.demande_id)).filter(Boolean))];
    const { data: demandes } = await supabase.from('demandes').select('*').in('id', demandeIds);
    const demandeMap = new Map((demandes || []).map((l: any) => [String(l.id), l]));

    const userIds = [...new Set([
      ...interventions.map((p: any) => p.mecanicien_id),
      ...demandes?.map((l: any) => l.client_id) || []
    ].filter(Boolean))];

    const usersData = await fetchUsers(userIds);
    const userMap = new Map(usersData.map((u: any) => [String(u.id), u]));

    const enriched = interventions.map((p: any) => {
      const demande: any = demandeMap.get(String(p.demande_id));
      const client = userMap.get(String(demande?.client_id));
      const mechanic = userMap.get(String(p.mecanicien_id));
      return {
        ...p,
        mechanic_id: p.mecanicien_id,
        client_id: demande?.client_id,
        demande_id: p.demande_id,
        price: p.final_price,
        mechanic,
        client,
        demande: demande ? { ...demande, client } : null
      };
    });

    res.json(enriched);
  } catch (error: any) {
    console.error("GET /interventions error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Route pour l'historique des interventions du mécanicien
apiRouter.get("/interventions/history", authMiddleware, async (req: any, res) => {
  try {
    if (req.user.role !== 'mecanicien') {
      return res.status(403).json({ error: "Accès réservé aux mécaniciens" });
    }

    const { data, error } = await supabase
      .from('interventions')
      .select(`
        *,
        demande:demande_id (
          *,
          client:client_id (
            id,
            first_name,
            last_name,
            phone,
            photo,
            vehicle_type
          )
        )
      `)
      .eq('mecanicien_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour terminer une intervention
apiRouter.post("/interventions/:id/complete", authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    
    const { data: intervention, error: findError } = await supabase
      .from('interventions')
      .select('*')
      .eq('id', id)
      .eq('mecanicien_id', req.user.id)
      .single();

    if (findError || !intervention) {
      return res.status(404).json({ error: "Intervention non trouvée" });
    }

    await supabase.from('interventions').update({
      status: 'completed',
      date_finished: new Date().toISOString()
    }).eq('id', id);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour annuler une intervention
apiRouter.post("/interventions/:id/cancel", authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    
    const { data: intervention, error: findError } = await supabase
      .from('interventions')
      .select('*')
      .eq('id', id)
      .eq('mecanicien_id', req.user.id)
      .single();

    if (findError || !intervention) {
      return res.status(404).json({ error: "Intervention non trouvée" });
    }

    await supabase.from('interventions').update({
      status: 'cancelled',
      date_finished: new Date().toISOString()
    }).eq('id', id);

    // Réouvrir la demande
    await supabase.from('demandes').update({ status: 'open' }).eq('id', intervention.demande_id);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour demander un avis
apiRouter.post("/interventions/:id/request-review", authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    
    const { data: intervention, error: findError } = await supabase
      .from('interventions')
      .select('*, demande:demande_id(client_id)')
      .eq('id', id)
      .eq('mecanicien_id', req.user.id)
      .single();

    if (findError || !intervention) {
      return res.status(404).json({ error: "Intervention non trouvée" });
    }

    if (intervention.status !== 'completed') {
      return res.status(400).json({ error: "L'intervention doit être terminée pour demander un avis" });
    }

    await supabase.from('interventions').update({
      review_requested: true,
      review_requested_at: new Date().toISOString()
    }).eq('id', id);

    await supabase.from('messages').insert({
      sender_id: req.user.id,
      receiver_id: intervention.demande.client_id,
      content: "⭐ Votre avis nous intéresse ! Merci de noter votre expérience avec ce mécanicien.",
      created_at: new Date().toISOString()
    });

    res.json({ success: true, message: "Demande d'avis envoyée" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour laisser un avis
apiRouter.post("/interventions/:id/review", authMiddleware, async (req: any, res) => {
  const { rating, comment } = req.body;
  const { id } = req.params;
  
  try {
    const { data: intervention, error: findError } = await supabase
      .from('interventions')
      .select('*, demande:demande_id(client_id), mechanic:mecanicien_id(*)')
      .eq('id', id)
      .single();

    if (findError || !intervention) {
      return res.status(404).json({ error: "Intervention non trouvée" });
    }

    if (intervention.demande.client_id !== req.user.id) {
      return res.status(403).json({ error: "Non autorisé" });
    }

    const { error: reviewError } = await supabase.from('reviews').insert({
      reviewer_id: req.user.id,
      reviewed_id: intervention.mecanicien_id,
      intervention_id: id,
      rating: rating,
      comment: comment,
      created_at: new Date().toISOString()
    });

    if (reviewError) throw reviewError;

    // Mettre à jour la note moyenne
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewed_id', intervention.mecanicien_id);

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    await supabase.from('users').update({
      rating: avgRating,
      total_reviews: reviews.length
    }).eq('id', intervention.mecanicien_id);

    await supabase.from('interventions').update({ reviewed: true }).eq('id', id);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post("/interventions/:id/finish", authMiddleware, async (req: any, res) => {
  try {
    await supabase.from('interventions').update({ status: 'finished', date_finished: new Date().toISOString() }).eq('id', req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    console.error("POST /interventions/:id/finish error:", error);
    res.status(400).json({ error: error.message });
  }
});

app.use("/api", apiRouter);

try {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
  }
} catch (e) { }

app.listen(PORT, "0.0.0.0", () => console.log(`Server on ${PORT}`));

setInterval(async () => {
  try {
    // Keep alive
  } catch (e) { }
}, 300_000);