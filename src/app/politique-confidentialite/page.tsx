import Link from "next/link";

export const metadata = {
  title: "Politique de confidentialité — SAV JardiPro",
};

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300">
      {/* Header */}
      <div className="border-b border-[#1f1f1f]">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" className="w-8 h-8 object-contain rounded" alt="JardiPro" />
            <span className="text-white font-semibold text-sm">SAV JardiPro — Les Hauts de Californie</span>
          </div>
          <Link
            href="/login"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ← Retour
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-white mb-2">Politique de confidentialité</h1>
        <p className="text-zinc-500 text-sm mb-10">Dernière mise à jour : avril 2026</p>

        <div className="space-y-10 text-sm leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-white mb-3">1. Responsable du traitement</h2>
            <p>
              Le responsable du traitement des données personnelles est la société <strong className="text-white">Les Hauts de Californie</strong>,
              exploitant le service SAV JardiPro via la plateforme Quavio, située en Martinique (972).
            </p>
            <p className="mt-2">
              Pour toute question relative à vos données, vous pouvez nous contacter à l&apos;adresse email communiquée lors de votre prise en charge.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">2. Données collectées</h2>
            <p>Dans le cadre de l&apos;utilisation de notre espace client SAV, nous collectons les données suivantes :</p>
            <ul className="mt-3 space-y-1.5 list-none">
              {[
                "Nom et prénom",
                "Adresse email",
                "Numéro de téléphone",
                "Informations relatives aux équipements déposés (marque, modèle, numéro de série)",
                "Historique des interventions et réparations",
                "Messages échangés avec le service SAV",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#F47920] shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">3. Finalités du traitement</h2>
            <p>Vos données sont utilisées exclusivement pour :</p>
            <ul className="mt-3 space-y-1.5 list-none">
              {[
                "La gestion et le suivi de vos dossiers de réparation (tickets SAV)",
                "La communication entre le service technique et le client",
                "L'envoi de notifications par email (rappels de rendez-vous, statut de réparation)",
                "La planification des interventions",
                "L'amélioration de la qualité de service",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#F47920] shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">4. Base légale</h2>
            <p>
              Le traitement de vos données repose sur l&apos;exécution du contrat de service conclu lors du dépôt de votre matériel,
              ainsi que sur votre consentement explicite recueilli lors de la création de votre compte en ligne.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">5. Durée de conservation</h2>
            <p>
              Vos données sont conservées pendant une durée maximale de <strong className="text-white">3 ans</strong> à compter
              de la clôture de votre dernier dossier SAV, conformément aux obligations légales applicables.
              Les données de connexion (logs) sont conservées 1 an.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">6. Destinataires des données</h2>
            <p>
              Vos données sont accessibles uniquement au personnel habilité des Hauts de Californie (administrateurs et techniciens SAV).
              Elles ne sont jamais vendues, louées ou transmises à des tiers à des fins commerciales.
            </p>
            <p className="mt-2">
              Notre hébergement est assuré par <strong className="text-white">Vercel</strong> (infrastructure cloud) et
              <strong className="text-white"> Supabase</strong> (base de données), tous deux certifiés conformes aux exigences
              du RGPD pour les prestataires européens.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">7. Vos droits</h2>
            <p>Conformément au Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679), vous disposez des droits suivants :</p>
            <ul className="mt-3 space-y-1.5 list-none">
              {[
                "Droit d'accès à vos données personnelles",
                "Droit de rectification en cas d'inexactitude",
                "Droit à l'effacement (« droit à l'oubli »)",
                "Droit à la limitation du traitement",
                "Droit à la portabilité de vos données",
                "Droit d'opposition au traitement",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#F47920] shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              Pour exercer ces droits, contactez-nous directement en magasin ou par email. Vous pouvez également introduire
              une réclamation auprès de la <strong className="text-white">CNIL</strong> (Commission Nationale de l&apos;Informatique et des Libertés)
              sur <span className="text-zinc-400">www.cnil.fr</span>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">8. Sécurité</h2>
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données
              contre tout accès non autorisé, perte ou divulgation : chiffrement des mots de passe (bcrypt),
              connexions HTTPS, accès restreint par rôle, et journalisation des actions sensibles.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">9. Cookies</h2>
            <p>
              L&apos;espace client utilise un cookie de session sécurisé (<code className="text-xs bg-[#1a1a1a] px-1.5 py-0.5 rounded">HttpOnly</code>, <code className="text-xs bg-[#1a1a1a] px-1.5 py-0.5 rounded">SameSite=Lax</code>)
              uniquement à des fins d&apos;authentification. Aucun cookie publicitaire ou de traçage tiers n&apos;est utilisé.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">10. Modifications</h2>
            <p>
              Nous nous réservons le droit de mettre à jour cette politique à tout moment. La date de dernière mise à jour
              est indiquée en haut de cette page. En continuant à utiliser le service après modification, vous acceptez
              la nouvelle version.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-[#1f1f1f] flex items-center justify-between text-xs text-zinc-600">
          <span>© {new Date().getFullYear()} Les Hauts de Californie — SAV JardiPro</span>
          <Link href="/login" className="hover:text-zinc-400 transition-colors">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
