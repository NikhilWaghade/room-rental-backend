import { supabase } from "../config/supabase.js";
import {
  uploadImageToCloudinary,
  uploadVideoToCloudinary,
  // uploadVideoToSupabase 
} from "../utils/imageUpload.js";

/* CREATE ROOM (MULTIPLE IMAGES) */

export const createRoom = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      city,
      location,
      room_type,
      furnished,
      owner_id,
    } = req.body;

    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .insert([
        {
          title,
          description,
          price,
          city: city.trim(),
          location,
          room_type,
          furnished,
          owner_id,
        },
      ])
      .select()
      .single();

    if (roomError) return res.status(400).json(roomError);

    const roomId = roomData.id;
    const imageUrls = [];
    let videoUrl = null;

    /* ✅ Images - Cloudinary pe */
    if (req.files?.images && req.files.images.length > 0) {
      for (const file of req.files.images) {
        const imageUrl = await uploadImageToCloudinary(file); // ✅ Supabase → Cloudinary
        imageUrls.push(imageUrl);
        await supabase.from("room_images").insert([
          {
            room_id: roomId,
            image_url: imageUrl,
          },
        ]);
      }
    }

    /* ✅ Video - Same rahega */
    if (req.files?.video && req.files.video.length > 0) {
      videoUrl = await uploadVideoToCloudinary(req.files.video[0]);
      await supabase
        .from("rooms")
        .update({ video_url: videoUrl })
        .eq("id", roomId);
    }
    res.json({
      message: "Room created successfully",
      room: roomData,
      images: imageUrls,
      video: videoUrl,
    });
  } catch (err) {
    console.error("CREATE ROOM ERROR:", err); // ✅ Error clearly dikhega
    res.status(500).json({ error: err.message });
  }
};

/* GET ALL ROOMS */

export const getRooms = async (req, res) => {
  try {
    const {
      city,
      location,
      room_type,
      furnished,
      price,
      price_min,
      price_max,
      sort,
      page = 1,
      limit = 20,
    } = req.query;

    const from = (page - 1) * limit;
    const to = from + Number(limit) - 1;

    let query = supabase.from("rooms").select(
      `
        *,
        room_images(image_url)
      `,
      { count: "exact" },
    );

    /* ---------- FILTERS ---------- */

    if (city) {
      query = query.ilike("city", `%${city}%`);
    }

    if (location) {
      query = query.ilike("location", `%${location}%`);
    }

    if (room_type) {
      query = query.ilike("room_type", room_type);
    }

    if (furnished !== undefined) {
      query = query.eq("furnished", furnished === "true");
    }

    /* price from frontend */

    if (price) {
      query = query.lte("price", Number(price));
    }

    if (price_min) {
      query = query.gte("price", Number(price_min));
    }

    if (price_max) {
      query = query.lte("price", Number(price_max));
    }

    /* ---------- SORT ---------- */

    if (sort === "price_asc") {
      query = query.order("price", { ascending: true });
    }

    if (sort === "price_desc") {
      query = query.order("price", { ascending: false });
    }

    /* ---------- PAGINATION ---------- */

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return res.status(400).json(error);
    }

    const rooms = data.map((room) => {
      const { room_images, ...rest } = room;

      return {
        ...rest,
        images: room_images.map((img) => img.image_url),
      };
    });

    res.json({
      total: count,
      page: Number(page),
      limit: Number(limit),
      rooms,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};
/* GET SINGLE ROOM */

export const getRoomById = async (req, res) => {
  const { id } = req.params;

  // Step 1: Room fetch karo
  const { data: roomData, error: roomError } = await supabase
    .from("rooms")
    .select(`*, room_images(image_url)`)
    .eq("id", id)
    .single();

  if (roomError) return res.status(400).json(roomError);

  // Step 2: Owner fetch karo — sirf id, name, phone
  const { data: ownerData, error: ownerError } = await supabase
    .from("users")
    .select("id, name, phone") // ✅ city aur location hata diya
    .eq("id", roomData.owner_id)
    .single();

  console.log("owner_id:", roomData.owner_id);
  console.log("ownerData:", ownerData);
  console.log("ownerError:", ownerError);

  // Step 3: Combine karke bhejo
  const room = {
    ...roomData,
    images: roomData.room_images.map((img) => img.image_url),
    owner: ownerData || null,
  };

  res.json(room);
};

/* DELETE ROOM */

export const deleteRoom = async (req, res) => {
  const { id } = req.params;

  /* Get room */

  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", id)
    .single();

  if (!room) {
    return res.status(404).json({
      message: "Room not found",
    });
  }

  /* Ownership check */

  if (room.owner_id !== req.user.id) {
    return res.status(403).json({
      message: "You can delete only your own room",
    });
  }

  /* Delete room */

  await supabase.from("rooms").delete().eq("id", id);

  res.json({
    message: "Room deleted successfully",
  });
};

/* GET MY ROOMS (OWNER) */

export const getMyRooms = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "User not authenticated",
      });
    }

    const ownerId = req.user.id;

    const { data, error } = await supabase
      .from("rooms")
      .select(
        `
    *,
    room_images(image_url)
   `,
      )
      .eq("owner_id", ownerId);

    if (error) {
      return res.status(400).json(error);
    }

    const formattedRooms = data.map((room) => ({
      ...room,
      images: room.room_images.map((img) => img.image_url),
    }));

    res.json(formattedRooms);
  } catch (err) {
    console.log(err);

    res.status(500).json({
      error: err.message,
    });
  }
};

/* UPDATE ROOM */

export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      title,
      description,
      price,
      city,
      location,
      room_type,
      furnished,
    } = req.body;

    /* =========================
       CHECK ROOM EXISTS
    ========================== */

    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", id)
      .single();

    if (roomError || !room) {
      return res.status(404).json({
        message: "Room not found",
      });
    }

    /* =========================
       OWNERSHIP CHECK
    ========================== */

    if (room.owner_id !== req.user.id) {
      return res.status(403).json({
        message: "You can update only your own room",
      });
    }

    /* =========================
       VIDEO UPLOAD
    ========================== */

    let videoUrl = room.video_url || "";

    if (
      req.files &&
      req.files.video &&
      req.files.video.length > 0
    ) {
      videoUrl = await uploadVideoToCloudinary(
        req.files.video[0]
      );
    }

    /* =========================
       UPDATE ROOM DATA
    ========================== */

    const { data: updatedRoom, error: updateError } =
      await supabase
        .from("rooms")
        .update({
          title,
          description,
          price: Number(price),
          city,
          location,
          room_type,
          furnished:
            furnished === "true" || furnished === true,
          video_url: videoUrl,
        })
        .eq("id", id)
        .select()
        .single();

    if (updateError) {
      console.log(updateError);

      return res.status(400).json({
        error: updateError.message,
      });
    }

    /* =========================
       IMAGE UPLOAD
    ========================== */

    if (
      req.files &&
      req.files.images &&
      req.files.images.length > 0
    ) {
      for (const file of req.files.images) {
        const imageUrl =
          await uploadImageToCloudinary(file);

        await supabase.from("room_images").insert([
          {
            room_id: id,
            image_url: imageUrl,
          },
        ]);
      }
    }

    /* =========================
       GET UPDATED IMAGES
    ========================== */

    const { data: roomImages } = await supabase
      .from("room_images")
      .select("image_url")
      .eq("room_id", id);

    const images =
      roomImages?.map((img) => img.image_url) || [];

    /* =========================
       RESPONSE
    ========================== */

    res.status(200).json({
      message: "Room updated successfully",
      room: updatedRoom,
      images,
      video: videoUrl,
    });
  } catch (err) {
    console.log("UPDATE ROOM ERROR:", err);

    res.status(500).json({
      error: err.message,
    });
  }
};

/* DELETE SINGLE IMAGE */

export const deleteRoomImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const { data: image } = await supabase
      .from("room_images")
      .select("*")
      .eq("id", imageId)
      .single();

    if (!image) {
      return res.status(404).json({
        message: "Image not found",
      });
    }

    const { data: room } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", image.room_id)
      .single();

    if (room.owner_id !== req.user.id) {
      return res.status(403).json({
        message: "You can delete only your own room images",
      });
    }

    const fileName = image.image_url.split("/").pop();

    const { error: storageError } = await supabase.storage
      .from("room-images")
      .remove([fileName]);

    if (storageError) {
      console.log("Storage delete error:", storageError);
    }

    await supabase.from("room_images").delete().eq("id", imageId);

    res.json({
      message: "Image deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};
