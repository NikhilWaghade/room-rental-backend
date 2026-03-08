import { supabase } from "../config/supabase.js";

/*
ADD TO WISHLIST
POST /api/wishlist
*/

export const addWishlist = async (req, res) => {
    try {
        const { user_id, room_id } = req.body;

        const { data, error } = await supabase
            .from("wishlist")
            .insert([
                {
                    user_id,
                    room_id,
                },
            ])
            .select();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.status(201).json({
            message: "Room added to wishlist",
            data,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/*
GET USER WISHLIST
GET /api/wishlist/:userId
*/

export const getWishlist = async (req, res) => {
    try {
        const { userId } = req.params;

        const { data, error } = await supabase
            .from("wishlist")
            .select(
                `
        id,
        rooms(
          id,
          title,
          price,
          city,
          location
        )
      `
            )
            .eq("user_id", userId);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/*
REMOVE FROM WISHLIST
DELETE /api/wishlist/:id
*/

export const removeWishlist = async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from("wishlist")
            .delete()
            .eq("id", id);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        res.json({
            message: "Removed from wishlist",
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};