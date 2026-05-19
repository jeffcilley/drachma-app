'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(session.user);
          fetchUserData(session.user.id);
        } else {
          setUser(null);
          setChapter(null);
          setDbUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserData(authId) {
    try {
      // Fetch user and chapter in one query
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          role,
          chapter_id,
          chapters (
            id,
            name,
            university,
            plan,
            primary_color,
            greek_letters
          )
        `)
        .eq('auth_id', authId)
        .single();

      if (data) {
        setDbUser(data);
        setChapter(data.chapters);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider value={{ user, chapter, dbUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);