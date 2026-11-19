import LegalPage from '../components/LegalPage.jsx'
import { APP_NAME, CONTACT } from '../utils/constants.js'

const SECTIONS = [
  {
    heading: 'Information we collect',
    paragraphs: ['We collect only what we need to run your membership and keep you safe at the gym:'],
    list: [
      'Account details: name, email address, phone number and password (stored only in encrypted, hashed form).',
      'Profile details you choose to give us: date of birth, gender, address, emergency contact, height, weight and health notes.',
      'Membership, payment and attendance records created when you join, pay or visit.',
      'Messages and enquiries you send through our website forms.',
      'Basic technical data such as IP address, used to protect the service from abuse.',
    ],
  },
  {
    heading: 'How we use your information',
    list: [
      'To create and manage your membership, payments and class bookings.',
      'To contact you about your membership, enquiries and important changes.',
      'To help trainers coach you safely, using only the details relevant to your training.',
      'To keep our systems secure and prevent fraud or misuse.',
      'To meet our legal and accounting obligations.',
    ],
  },
  {
    heading: 'Who can see your information',
    paragraphs: [
      'Gym administrators can see member records needed to run the gym. Trainers can see limited details of the members assigned to them. Other members cannot see your information.',
      'We do not sell your personal information. We share it only with service providers who help us run the gym (for example, payment processors, if we offer online payments), or when the law requires it.',
    ],
  },
  {
    heading: 'Cookies and local storage',
    paragraphs: [
      'We use one essential cookie to keep you logged in securely. It cannot be read by scripts on the page. We also store your light or dark theme choice in your browser. We do not use advertising cookies.',
    ],
  },
  {
    heading: 'Security',
    paragraphs: [
      'We use industry-standard measures such as password hashing, encrypted connections in production, access controls and activity logs. No system is perfectly secure, so please use a strong, unique password and keep it private.',
    ],
  },
  {
    heading: 'How long we keep data',
    paragraphs: [
      'We keep membership and payment records for as long as needed for accounting and legal reasons. When you ask us to delete your account, we remove your ability to log in and personal profile details where the law allows, but may retain financial records.',
    ],
  },
  {
    heading: 'Your choices',
    paragraphs: [
      'You can view and update most of your details from your dashboard. You may ask us to correct or delete your information, or withdraw consent for marketing messages, by contacting us.',
    ],
  },
  {
    heading: 'Children',
    paragraphs: [
      'Our services are intended for adults. Members under 18 need the consent of a parent or guardian, who should contact us to arrange membership.',
    ],
  },
  {
    heading: 'Changes to this policy',
    paragraphs: ['We may update this policy from time to time. The date at the top shows when it was last changed.'],
  },
  {
    heading: 'Contact us',
    paragraphs: [`Questions about privacy? Email ${CONTACT.email} or call ${CONTACT.phone}.`],
  },
]

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`This policy explains how ${APP_NAME} collects, uses and protects your personal information when you use our website and gym services.`}
      sections={SECTIONS}
    />
  )
}