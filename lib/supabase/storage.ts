import { createClient } from './client';
import { v4 as uuidv4 } from 'uuid';

export const uploadAvatar = async (file: File, userId: string): Promise<string> => {
    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${uuidv4()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
            upsert: true,
        });

    if (uploadError) {
        throw uploadError;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

    return data.publicUrl;
};
