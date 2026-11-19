import LegalPage from '../components/LegalPage.jsx'
import { LEGAL } from '../utils/content.js'
import { APP_NAME, CONTACT } from '../utils/constants.js'

const SECTIONS = [
  {
    heading: 'Acceptance of these terms',
    paragraphs: [
      `By creating an account, joining or using the facilities of ${APP_NAME}, you agree to these terms. If you do not agree, please do not use our services.`,
    ],
  },
  {
    heading: 'Membership and fees',
    paragraphs: [
      'Each membership runs for the period of the plan you choose, starting on the agreed start date. The price shown when you join is the price you pay for that membership, even if our prices change later.',
      'A membership becomes active once your first payment is recorded and your start date arrives. Memberships are personal and cannot be shared or transferred.',
    ],
  },
  {
    heading: 'Payments and refunds',
    paragraphs: [
      'Payments are recorded by our front desk against your membership, and you will receive a receipt. Part payments may be accepted at our discretion.',
      'Refunds, if any, are handled case by case according to the policy explained to you at the time of purchase.',
    ],
  },
  {
    heading: 'Health and safety',
    list: [
      'You confirm that you are medically fit to exercise, or that you have consulted a doctor.',
      'Please tell us about any injury or condition that may affect your training.',
      'Use equipment correctly and follow staff instructions. Ask a trainer if you are unsure.',
      'You exercise at your own risk, to the extent permitted by law.',
    ],
  },
  {
    heading: 'Conduct',
    paragraphs: [
      'Treat other members and staff with respect. Harassment, damage to property, or unsafe behaviour may lead to suspension or cancellation of your membership without refund.',
    ],
  },
  {
    heading: 'Classes and bookings',
    paragraphs: [
      'Active members may book classes subject to availability. Bookings can be cancelled before the class starts. Repeated no-shows may limit your booking ability.',
    ],
  },
  {
    heading: 'Your account',
    paragraphs: [
      'Keep your login details confidential and tell us immediately if you suspect unauthorised use. You are responsible for activity under your account.',
    ],
  },
  {
    heading: 'Suspension and cancellation',
    paragraphs: [
      'We may suspend or cancel a membership for breach of these terms or non-payment. You may ask to cancel your membership by contacting the front desk.',
    ],
  },
  {
    heading: 'Liability',
    paragraphs: [
      'To the extent permitted by law, we are not liable for loss of or damage to personal belongings, or for injuries that result from misuse of equipment or ignoring staff advice. Nothing in these terms limits liability that cannot be limited by law.',
    ],
  },
  {
    heading: 'Changes and governing law',
    paragraphs: [
      'We may update these terms, and the date at the top shows the latest version. These terms are governed by the laws of India, and disputes are subject to the courts of ' + LEGAL.jurisdiction + '.',
    ],
  },
  {
    heading: 'Contact us',
    paragraphs: [`Questions about these terms? Email ${CONTACT.email} or call ${CONTACT.phone}.`],
  },
]

export default function Terms() {
  return (
    <LegalPage
      title="Terms and Conditions"
      intro={`These terms apply to your use of the ${APP_NAME} website and gym. Please read them carefully.`}
      sections={SECTIONS}
    />
  )
}