import { supabase } from "../config/supabase.js";

/*
ADD TO WISHLIST
POST /api/wishlist/:roomId
*/

export const addWishlist = async (req, res) => {
    try {

        const { roomId } = req.params;
        const userId = req.user.id;

        /* Prevent duplicate wishlist */

        const { data: existing } = await supabase
            .from("wishlist")
            .select("*")
            .eq("user_id", userId)
            .eq("room_id", roomId)
            .single();

        if (existing) {
            return res.status(400).json({
                message: "Room already in wishlist"
            });
        }

        const { data, error } = await supabase
            .from("wishlist")
            .insert([
                {
                    user_id: userId,
                    room_id: roomId
                }
            ])
            .select()
            .single();

        if (error) {
            return res.status(500).json({
                error: error.message
            });
        }

        res.status(201).json({
            message: "Room added to wishlist",
            wishlist: data
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};


/*
GET USER WISHLIST
GET /api/wishlist
*/

export const getWishlist = async (req, res) => {
    try {

        const userId = req.user.id;

        const { data, error } = await supabase
            .from("wishlist")
            .select(`
        id,
        rooms(
          id,
          title,
          price,
          city,
          location,
          room_images(image_url)
        )
      `)
            .eq("user_id", userId);

        if (error) {
            return res.status(500).json({
                error: error.message
            });
        }

        const formatted = data.map(item => {
            const { rooms } = item;

            const { room_images, ...rest } = rooms;

            return {
                id: item.id,
                ...rest,
                images: room_images.map(img => img.image_url)
            };
        });

        res.json(formatted);

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};


/*
REMOVE FROM WISHLIST
DELETE /api/wishlist/:roomId
*/

export const removeWishlist = async (req, res) => {
    try {

        const { roomId } = req.params;
        const userId = req.user.id;

        const { error } = await supabase
            .from("wishlist")
            .delete()
            .eq("user_id", userId)
            .eq("room_id", roomId);

        if (error) {
            return res.status(500).json({
                error: error.message
            });
        }

        res.json({
            message: "Removed from wishlist"
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};