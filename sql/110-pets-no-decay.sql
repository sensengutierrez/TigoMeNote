-- TigoMeNote · 110 pets: hindi na bumababa ang mga bar ni Tigo (0.11.42)
-- Ang pet-fast ay hindi na nagbabawas nang kusa (RATE = 0). Isang beses lang ito: itaas ang mga bar na bumaba na dati,
-- para walang Tigo na naiwang gutom / pagod. Walang binabago sa XP, coins, o gamit.
update public.pets
   set hunger = greatest(hunger, 85), joy = greatest(joy, 85), energy = greatest(energy, 85), clean = greatest(clean, 85),
       stats_at = now(), updated_at = now()
 where hunger < 85 or joy < 85 or energy < 85 or clean < 85;
