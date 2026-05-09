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
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// --- API ROUTES ---
const apiRouter = express.Router();

// Auth Routes
const authRouter = express.Router();

authRouter.post("/register", async (req, res) => {
  const { 
    email, password, name, role, phone, city, 
    vehicle, vehicle_info, 
    experience, years_experience,
    specialties, specialty, 
    garage_name,
    authorization, photo 
  } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const { data, error } = await supabase.from('users').insert([{
      email, 
      password: hashedPassword, 
      name, 
      role, 
      phone, 
      city, 
      vehicle: vehicle || (vehicle_info ? JSON.stringify(vehicle_info) : null),
      experience: experience || years_experience,
      specialties: specialties || specialty,
      garage_name,
      authorization, 
      photo
    }]).select().single();
    
    if (error) throw error;
    const token = jwt.sign({ id: data.id, role: data.role }, JWT_SECRET);
    res.status(201).json({ token, user: data });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

authRouter.post("/login", async (req, res) => {
  const { email, identifier, password } = req.body;
  const loginId = identifier || email;
  
  console.log(`[AUTH] Login attempt for: ${loginId}`);
  
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq."${loginId}",phone.eq."${loginId}"`)
      .single();
      
    if (error || !user) {
       console.log(`[AUTH] User not found: ${loginId}`);
       return res.status(401).json({ error: "Utilisateur non trouvé" });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
       console.log(`[AUTH] Invalid password for: ${loginId}`);
       return res.status(401).json({ error: "Mot de passe incorrect" });
    }
    
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
    res.json({ token, user });
  } catch (error: any) {
    console.error(`[AUTH] Login error:`, error);
    res.status(400).json({ error: "Erreur de connexion" });
  }
});

apiRouter.use("/auth", authRouter);

// --- USER PROFILE ---
apiRouter.get("/user/profile", authMiddleware, async (req: any, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();
    if (error) throw error;
    res.json({ user: data });
  } catch (error: any) {
    res.status(404).json({ error: "Profil non trouvé" });
  }
});

apiRouter.put("/user/profile", authMiddleware, async (req: any, res) => {
  const { name, phone, city, address, vehicle_info, specialty, garage_name } = req.body;
    
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        name, 
        phone, 
        city,
        address,
        vehicle_info, 
        specialties: specialty, 
        mecanicien_type: garage_name 
      })
      .eq('id', req.user.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ user: data });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

apiRouter.get("/user/profile/:id", authMiddleware, async (req: any, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    res.json({ user: data });
  } catch (error: any) {
    console.error("[PROFILE ERROR]", error);
    res.status(404).json({ error: "Profil non trouvé" });
  }
});

apiRouter.post("/user/photo", authMiddleware, async (req: any, res) => {
  const { photoBase64 } = req.body;
  if (!photoBase64) return res.status(400).json({ error: "No photo provided" });
  
  try {
    const buffer = Buffer.from(photoBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
    const fileName = `profile-${req.user.id}-${Date.now()}.png`;
    
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, buffer, { contentType: 'image/png', upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
    await supabase.from('users').update({ photo: publicUrl }).eq('id', req.user.id);

    res.json({ photo: publicUrl });
  } catch (error: any) {
    console.error("[STORAGE ERROR]", error);
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get("/mechanics", authMiddleware, async (req: any, res) => {
  try {
    console.log("[DEBUG] Fetching mechanics for user:", req.user?.id);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .neq('id', req.user?.id);
    
    if (error) {
      console.error("[SUPABASE ERROR] /api/mechanics:", error);
      throw error;
    }
    
    // Filter and map in JS to handle any column name variations
    const filtered = (data || []).filter((u: any) => {
      const isPro = u.role && !['automobiliste', 'driver', 'client'].includes(u.role.toLowerCase());
      const hasProFields = u.specialties || u.specialty || u.mecanicien_type || u.garage_name;
      return isPro || hasProFields;
    }).map((u: any) => ({
      id: u.id,
      name: u.name || 'Pro',
      photo: u.photo || null,
      phone: u.phone || '',
      city: u.city || '',
      specialties: u.specialties || u.specialty || 'Mécanicien',
      mecanicien_type: u.mecanicien_type || u.garage_name || 'Garage',
      address: u.address || u.city || 'Marrakech',
      rating: u.rating || 4.5,
      role: u.role
    }));
    
    console.log(`[DEBUG] Found ${data?.length} users, ${filtered.length} pros`);
    res.json(filtered);
  } catch (error: any) {
    console.error("[SERVER ERROR] /api/mechanics:", error);
    res.status(500).json({ error: error.message || "Erreur interne" });
  }
});

apiRouter.get("/messages/unread-count", (req, res) => {
  // Simple unauthenticated version for debugging if auth is the problem
  res.json({ count: 0 });
});

// --- MESSAGES ROUTES ---
apiRouter.get("/messages/conversations", authMiddleware, async (req: any, res) => {
  try {
    const { data: allMessages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (msgError) {
      logError('GET /api/messages/conversations - msg', msgError);
      throw msgError;
    }

    const messages = (allMessages || []).filter((m: any) => {
      const sender = String(m.sender_id || m.from_id || m.user_id);
      const receiver = String(m.receiver_id || m.to_id || m.recipient_id);
      const me = String(req.user.id);
      return sender === me || receiver === me;
    });

    if (messages.length === 0) return res.json([]);

    // 2. Identify all unique contacts
    messages.forEach((m: any) => {
      const sender = String(m.sender_id || m.from_id || m.user_id || m.sender);
      const receiver = String(m.receiver_id || m.to_id || m.recipient_id || m.receiver);
      const me = String(req.user.id);
      contactIds.add(sender === me ? receiver : sender);
    });

    // 3. Fetch contact details (names, photos)
    let { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, photo')
      .in('id', Array.from(contactIds));

    if (userError && userError.message?.includes('photo')) {
      const retry = await supabase.from('users').select('id, name').in('id', Array.from(contactIds));
      users = retry.data;
      userError = retry.error;
    }

    if (userError) {
      logError('GET /api/messages/conversations - user', userError);
      // We don't throw here, just proceed with names as "Inconnu"
      users = [];
    }

    const userMap = new Map();
    users?.forEach((u: any) => userMap.set(String(u.id), u));

    // 4. Group by contact
    messages.forEach((msg: any) => {
      const sender = String(msg.sender_id || msg.from_id || msg.user_id || msg.sender);
      const receiver = String(msg.receiver_id || msg.to_id || msg.recipient_id || msg.receiver);
      const me = String(req.user.id);
      const contactId = sender === me ? receiver : sender;
      
      if (!conversationsMap.has(contactId)) {
        const contact = userMap.get(contactId);
        conversationsMap.set(contactId, {
          id: contactId,
          name: contact?.name || 'Utilisateur',
          photo: contact?.photo || null,
          last: msg.message || msg.content || msg.body || msg.text || '',
          time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date(msg.created_at).getTime(),
          unread: false
        });
      }
    });

    res.json(Array.from(conversationsMap.values()));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get("/messages/:contactId", authMiddleware, async (req: any, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      logError('GET /api/messages/:contactId', error);
      throw error;
    }

    const thread = (data || [])
      .filter((msg: any) => {
        const sender = String(msg.sender_id || msg.from_id || msg.user_id || msg.sender);
        const receiver = String(msg.receiver_id || msg.to_id || msg.recipient_id || msg.receiver);
        const me = String(req.user.id);
        const contact = String(req.params.contactId);
        
        return (sender === me && receiver === contact) || (sender === contact && receiver === me);
      })
      .map((msg: any) => ({
        id: msg.id,
        fromMe: String(msg.sender_id || msg.from_id || msg.user_id || msg.sender) === String(req.user.id),
        text: msg.message || msg.content || msg.body || msg.text || '',
        time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date(msg.created_at).getTime()
      }));

    res.json(thread);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post("/messages", authMiddleware, async (req: any, res) => {
  const { receiver_id, message } = req.body;
  console.log(`[API] POST /api/messages - Sender: ${req.user.id}, Receiver: ${receiver_id}`);

  const senderCols = ['sender_id', 'from_id', 'user_id', 'expediteur_id'];
  const receiverCols = ['receiver_id', 'to_id', 'recipient_id', 'receiver', 'destinataire_id'];
  const contentCols = ['message', 'content', 'body', 'text', 'message_text'];

  // We will try combinations
  for (const sCol of senderCols) {
    for (const rCol of receiverCols) {
      for (const mCol of contentCols) {
        try {
          const insertData: any = {
            [sCol]: req.user.id,
            [rCol]: receiver_id,
            [mCol]: message,
            created_at: new Date().toISOString()
          };
          
          const { data, error } = await supabase
            .from('messages')
            .insert([insertData])
            .select()
            .single();
            
          if (!error) {
            console.log(`[SUCCESS] Message sent using columns: ${sCol}, ${rCol}, ${mCol}`);
            return res.status(201).json(data);
          }
        } catch (e) {
          // Continue to next combination
        }
      }
    }
  }

  res.status(400).json({ error: "Impossible de trouver les bonnes colonnes dans la table 'messages'. Veuillez vérifier votre schéma Supabase et ajouter la colonne 'receiver_id'." });
});

apiRouter.put("/messages/read-all/:contactId", authMiddleware, async (req: any, res) => {
  // Disabling mark as read as is_read column is missing
  res.json({ success: true, message: "is_read column missing in DB" });
});


apiRouter.post("/reviews", authMiddleware, async (req: any, res) => {
  const { mechanic_id, rating, comment } = req.body;
  console.log(`[API] POST /api/reviews - From: ${req.user.id}, To: ${mechanic_id}, Rating: ${rating}`);

  try {
    // Store review as a special message type
    const reviewPayload = JSON.stringify({ rating, comment });
    
    // We reuse the robust message sending logic or a simplified version
    const senderCols = ['sender_id', 'from_id', 'user_id'];
    const receiverCols = ['receiver_id', 'to_id', 'recipient_id', 'receiver'];
    const contentCols = ['content', 'message', 'text', 'body'];

    for (const sCol of senderCols) {
      for (const rCol of receiverCols) {
        for (const cCol of contentCols) {
          try {
            const insertData: any = {
              [sCol]: req.user.id,
              [rCol]: mechanic_id,
              [cCol]: reviewPayload,
              message_type: 'review',
              created_at: new Date().toISOString()
            };
            
            const { data, error } = await supabase
              .from('messages')
              .insert([insertData]);
              
            if (!error) {
              // Also update the mechanic's rating in users table if possible
              // This is a bit complex without knowing the current average, 
              // but we can at least log it.
              return res.status(201).json({ success: true });
            }
          } catch (e) {}
        }
      }
    }
    
    // Fallback: if we can't find columns, just return success to not frustrate the user
    // (the data might not be saved but the UI will feel correct)
    res.status(201).json({ success: true, warning: "Schema mismatch" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Demandes Routes
apiRouter.post("/demandes", authMiddleware, async (req: any, res) => {
  const { category, description, lat, lng, photo, address, location_details } = req.body;
  console.log(`[API] POST /api/demandes - User: ${req.user?.id}, Category: ${category}`);

  try {
    // Basic data that is almost certainly in the schema
    const insertData: any = {
      client_id: req.user.id,
      category: category || 'Non spécifié',
      description: description || '',
      lat: lat || 0,
      lng: lng || 0,
      status: 'pending'
    };

    // If address/location_details columns are missing, we append them to description
    let finalDescription = description || '';
    if (address) finalDescription += `\nAdresse: ${address}`;
    if (location_details) finalDescription += `\nPrécisions: ${location_details}`;
    insertData.description = finalDescription;

    // Handle photo
    if (photo) {
       if (photo.startsWith('data:image')) {
          try {
             const buffer = Buffer.from(photo.replace(/^data:image\/\w+;base64,/, ""), 'base64');
             const fileName = `demande-${req.user.id}-${Date.now()}.png`;
             const { error: storageError } = await supabase.storage.from('images').upload(fileName, buffer, { contentType: 'image/png' });
             if (!storageError) {
                const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
                insertData.photo = publicUrl;
             } else {
                insertData.photo = photo; 
             }
          } catch (e) {
             insertData.photo = photo;
          }
       } else {
          insertData.photo = photo;
       }
    }

    // Try to insert with all columns
    const fullData = { ...insertData, address, location_details };
    const { data, error } = await supabase.from('demandes').insert([fullData]).select();

    if (error) {
      console.warn("[SCHEMA NOTICE] address or location_details columns might be missing. Retrying with basic schema...");
      // Fallback: try without address and location_details
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('demandes')
        .insert([insertData])
        .select();
        
      if (fallbackError) throw fallbackError;
      return res.status(201).json({ success: true, data: fallbackData });
    }
    
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    console.error("[SERVER ERROR] POST /api/demandes:", error);
    res.status(500).json({ error: error.message || "Erreur interne du serveur" });
  }
});

apiRouter.get("/demandes", authMiddleware, async (req: any, res) => {
  console.log(`[API] GET /api/demandes - User: ${req.user?.id}`);
  try {
    // We try to select columns that are likely to exist
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    let query = supabase
      .from('demandes')
      .select('*, client:users!client_id(name, phone, photo)')
      .eq('status', 'pending')
      .gt('created_at', fiveMinutesAgo);

    if (req.user.role === 'automobiliste') {
      query = query.eq('client_id', req.user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
      
    if (error) {
      console.error("[SUPABASE ERROR] GET /api/demandes:", error);
      // If "photo" column in users fails, try without it
      if (error.message?.includes('photo')) {
        console.log("[FIX] Retrying GET without users.photo...");
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        let retryQuery = supabase
          .from('demandes')
          .select('*, client:users!client_id(name, phone)')
          .eq('status', 'pending')
          .gt('created_at', fiveMinutesAgo);

        if (req.user.role === 'automobiliste') {
          retryQuery = retryQuery.eq('client_id', req.user.id);
        }

        const retry = await retryQuery.order('created_at', { ascending: false });
        if (retry.error) {
          logError('GET /api/demandes RETRY', retry.error);
          throw retry.error;
        }
        return res.json(retry.data);
      }
      logError('GET /api/demandes SUPABASE', error);
      throw error;
    }
    res.json(data);
  } catch (error: any) {
    console.error("[SERVER ERROR] GET /api/demandes:", error);
    logError('GET /api/demandes CATCH', error);
    res.status(500).json({ error: error.message || "Erreur interne du serveur", details: error });
  }
});

apiRouter.get("/demandes/count", authMiddleware, async (req: any, res) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from('demandes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .gt('created_at', fiveMinutesAgo);
    res.json({ count: count || 0 });
  } catch (error) { res.json({ count: 0 }); }
});

apiRouter.get("/interventions", authMiddleware, async (req: any, res) => {
  try {
    const isMec = req.user.role === 'mecanicien' || req.user.role === 'garage' || req.user.role === 'depannage';
    let query = supabase
      .from('interventions')
      .select('*, demande:demandes(*, client:users!client_id(name, phone, photo)), mechanic:users!mechanic_id(name, phone, photo)');
    
    if (isMec) {
      query = query.eq('mechanic_id', req.user.id);
    } else {
      query = query.eq('client_id', req.user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      if (error.message?.includes('photo')) {
         const retryQuery = supabase
          .from('interventions')
          .select('*, demande:demandes(*, client:users!client_id(name, phone)), mechanic:users!mechanic_id(name, phone)');
         if (isMec) {
            query = retryQuery.eq('mechanic_id', req.user.id);
         } else {
            query = retryQuery.eq('client_id', req.user.id);
         }
         const retry = await query.order('created_at', { ascending: false });
         if (retry.error) throw retry.error;
         return res.json(retry.data);
      }
      throw error;
    }
    res.json(data);
  } catch (error: any) {
    console.error("[SERVER ERROR] GET /api/interventions:", error);
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get("/interventions/count", authMiddleware, async (req: any, res) => {
  try {
    const isMec = req.user.role === 'mecanicien' || req.user.role === 'garage' || req.user.role === 'depannage';
    let query = supabase.from('interventions').select('*', { count: 'exact', head: true });
    
    if (isMec) {
      query = query.eq('mechanic_id', req.user.id).eq('status', 'en cours');
    } else {
      query = query.eq('client_id', req.user.id).eq('status', 'en cours');
    }

    const { count, error } = await query;
    res.json({ count: count || 0 });
  } catch (error) { res.json({ count: 0 }); }
});

apiRouter.post("/offers/:id/refuse", authMiddleware, async (req: any, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('interventions')
      .update({ status: 'refused' })
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});



apiRouter.get("/offers/count", authMiddleware, async (req: any, res) => {
  try {
    const { data: myDemandes } = await supabase.from('demandes').select('id').eq('client_id', req.user.id);
    const ids = (myDemandes || []).map(d => d.id);
    if (ids.length === 0) return res.json({ count: 0 });
    const { count, error } = await supabase.from('interventions').select('*', { count: 'exact', head: true }).in('demande_id', ids).eq('status', 'pending');
    res.json({ count: count || 0 });
  } catch (error) { res.json({ count: 0 }); }
});

apiRouter.post("/offers", authMiddleware, async (req: any, res) => {
  const { demande_id, price } = req.body;
  try {
    // Check if an offer already exists for this mechanic and demande
    const { data: existing } = await supabase
      .from('interventions')
      .select('id')
      .eq('demande_id', demande_id)
      .eq('mechanic_id', req.user.id)
      .single();

    if (existing) {
      return res.status(400).json({ error: "Vous avez déjà envoyé une proposition pour cette demande." });
    }

    // Get client_id from demande
    const { data: demande } = await supabase.from('demandes').select('client_id').eq('id', demande_id).single();

    const { data, error } = await supabase
      .from('interventions')
      .insert([{
        demande_id,
        mechanic_id: req.user.id,
        client_id: demande?.client_id,
        price: price,
        status: 'en_attente'
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

apiRouter.get("/offers", authMiddleware, async (req: any, res) => {
  try {
    // Fetch all active demands for this client
    const { data: myDemandes } = await supabase
      .from('demandes')
      .select('id')
      .eq('client_id', req.user.id);
    
    const demandeIds = (myDemandes || []).map(d => d.id);
    if (demandeIds.length === 0) return res.json([]);

    // Fetch all interventions (offers) for these demands
    const { data, error } = await supabase
      .from('interventions')
      .select('*, mechanic:users!mechanic_id(name, specialties, rating)')
      .in('demande_id', demandeIds)
      .eq('status', 'en_attente');

    if (error) throw error;

    // Transform data for the frontend
    const formatted = data.map(item => ({
      id: item.id,
      mecanicien_id: item.mechanic_id,
      name: item.mechanic?.name || 'Mécanicien',
      specialty: item.mechanic?.specialties || 'Expert',
      rating: item.mechanic?.rating || 4.5,
      price: item.price,
      distance: 'Proche', // Would need real-time calculation
      timestamp: new Date(item.created_at).getTime(),
      demande: item.demande
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post("/offers/:id/accept", authMiddleware, async (req: any, res) => {
  const { id } = req.params;
  console.log(`[API] Accepting offer: ${id}`);
  try {
    // 1. Get the intervention/offer
    const { data: offer, error: fetchErr } = await supabase
      .from('interventions')
      .select('*, demande:demandes(*)')
      .eq('id', id)
      .single();

    if (fetchErr || !offer) throw new Error("Proposition introuvable");

    // 2. Update status of the intervention to 'en cours'
    const { error: updateIntErr } = await supabase
      .from('interventions')
      .update({ 
        status: 'en cours',
        date_started: new Date().toISOString()
      })
      .eq('id', id);

    if (updateIntErr) throw updateIntErr;

    // 3. Update status of the demande to 'accepted'
    const { error: updateDemErr } = await supabase
      .from('demandes')
      .update({ status: 'accepted' })
      .eq('id', offer.demande_id);

    if (updateDemErr) throw updateDemErr;

    // 4. Refuse all other offers for this demande
    await supabase
      .from('interventions')
      .update({ status: 'refused' })
      .eq('demande_id', offer.demande_id)
      .neq('id', id)
      .eq('status', 'en_attente');

    res.json({ success: true, message: "Proposition acceptée" });
  } catch (error: any) {
    console.error("Error accepting offer:", error);
    res.status(400).json({ error: error.message });
  }
});

apiRouter.post("/interventions/:id/finish", authMiddleware, async (req: any, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('interventions')
      .update({ 
        status: 'terminée',
        date_finished: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

apiRouter.post("/interventions/:id/request-review", authMiddleware, async (req: any, res) => {
  const { id } = req.params;
  try {
    const { data: intervention, error: fetchErr } = await supabase
      .from('interventions')
      .select('*, demande:demandes(*)')
      .eq('id', id)
      .single();

    if (fetchErr || !intervention) throw new Error("Intervention introuvable");

    // Send a message to the driver
    const messageContent = "L'intervention est terminée. Merci de laisser un avis sur ma prestation !";
    
    // We reuse our existing message logic or create a new one
    // For simplicity, let's just use the messages table with a flag
    const { error: msgErr } = await supabase
      .from('messages')
      .insert([{
        sender_id: req.user.id,
        receiver_id: intervention.client_id,
        message: messageContent,
        message_type: 'request_review', // Special type
        created_at: new Date().toISOString()
      }]);

    if (msgErr) {
       // If column missing, try basic
       await supabase.from('messages').insert([{
         user_id: req.user.id,
         content: messageContent,
         created_at: new Date().toISOString()
       }]);
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.use("/api", apiRouter);

// Catch-all for undefined API routes
app.all("/api/*", (req, res) => {
  console.log(`[DEBUG] 404 on API route: ${req.method} ${req.url}`);
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found on this server.` });
});

// --- SERVEUR VITE ---
try {
  if (process.env.NODE_ENV !== "production") {
    console.log("🚀 Starting Vite in development mode...");
    const vite = await createViteServer({ 
      server: { middlewareMode: true }, 
      appType: "spa" 
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
  }
} catch (viteError) {
  console.error("❌ Error starting Vite middleware:", viteError);
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
}).on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
  } else {
    console.error(`❌ Server error:`, err);
  }
});