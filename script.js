// ------------------------------------------------------------
// GUEST LIST
// ------------------------------------------------------------
const guestList = {
  "sample guest": { displayName: "Sample Guest", seats: 1 },
  "christian dave dichos": { displayName: "Christian Dave Dichos", seats: 1 },
  "juan dela cruz": { displayName: "Juan Dela Cruz", seats: 1 },
  "maria santos": { displayName: "Maria Santos", seats: 2 }
};

const supabaseClient = window.supabase
  ? window.supabase.createClient(
      "https://twqknyqbskgcjyqrnvzh.supabase.co",
      "sb_publishable_VKfvmXng_zOJfkeqRk1K6A_Qzalsrj_"
    )
  : null;

const RSVP_STORAGE_KEY = "wedding-rsvp-records";

// ------------------------------------------------------------
// HELPER FUNCTIONS
// ------------------------------------------------------------
const $ = (selector, scope = document) =>
  scope.querySelector(selector);

const $$ = (selector, scope = document) =>
  [...scope.querySelectorAll(selector)];


// ------------------------------------------------------------
// ELEMENTS
// ------------------------------------------------------------
const body = document.body;

const loader = $("#pageLoader");
const gate = $("#invitationGate");
const siteShell = $("#siteShell");
const openInvitation = $("#openInvitation");

const siteHeader = $("#siteHeader");
const menuToggle = $("#menuToggle");
const mobileNav = $("#mobileNav");


// ------------------------------------------------------------
// PAGE LOADER
// ------------------------------------------------------------
window.addEventListener("load", () => {

  setTimeout(() => {
    loader.classList.add("hide");
  }, 350);

});


// ------------------------------------------------------------
// OPEN INVITATION
// ------------------------------------------------------------
openInvitation.addEventListener("click", (event) => {

  gate.classList.add("opened");

  siteShell.classList.add("visible");

  siteShell.setAttribute(
    "aria-hidden",
    "false"
  );

  body.classList.remove("locked");

  setTimeout(() => {

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }, 350);

});


// ------------------------------------------------------------
// STICKY HEADER
// ------------------------------------------------------------
window.addEventListener("scroll", () => {

  siteHeader.classList.toggle(
    "scrolled",
    window.scrollY > 20
  );

});


// ------------------------------------------------------------
// MOBILE MENU
// ------------------------------------------------------------
menuToggle.addEventListener("click", () => {

  const open =
    mobileNav.classList.toggle("open");

  menuToggle.setAttribute(
    "aria-expanded",
    String(open)
  );

  menuToggle.setAttribute(
    "aria-label",
    open ? "Close menu" : "Open menu"
  );

});


// Close menu after clicking a link
$$(".mobile-nav a").forEach(link => {

  link.addEventListener("click", () => {

    mobileNav.classList.remove("open");

    menuToggle.setAttribute(
      "aria-expanded",
      "false"
    );

  });

});


// ------------------------------------------------------------
// SCROLL REVEAL ANIMATIONS
// ------------------------------------------------------------
const revealObserver =
  new IntersectionObserver(
    (entries) => {

      entries.forEach(entry => {

        if (entry.isIntersecting) {

          entry.target.classList.add(
            "visible"
          );

          revealObserver.unobserve(
            entry.target
          );

        }

      });

    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -40px"
    }
  );

$$(".reveal").forEach(element => {

  revealObserver.observe(element);

});


// ------------------------------------------------------------
// FAQ ACCORDION
// ------------------------------------------------------------
$$(".faq-question").forEach(button => {

  button.addEventListener("click", () => {

    const item =
      button.closest(".faq-item");

    const answer =
      $(".faq-answer", item);

    const wasOpen =
      item.classList.contains("open");


    // Close other FAQs
    $$(".faq-item.open").forEach(other => {

      if (other !== item) {

        other.classList.remove("open");

        $(".faq-question", other)
          .setAttribute(
            "aria-expanded",
            "false"
          );

        $(".faq-answer", other)
          .style.maxHeight = "0px";

      }

    });


    // Toggle current FAQ
    item.classList.toggle(
      "open",
      !wasOpen
    );

    button.setAttribute(
      "aria-expanded",
      String(!wasOpen)
    );

    answer.style.maxHeight =
      !wasOpen
        ? `${answer.scrollHeight}px`
        : "0px";

  });

});


// ------------------------------------------------------------
// RSVP ELEMENTS
// ------------------------------------------------------------
const form = $("#rsvpForm");

const lookupStep = $("#lookupStep");
const responseStep = $("#responseStep");

const guestNameInput = $("#guestName");
const lookupMessage = $("#lookupMessage");
const findInvitation = $("#findInvitation");

const welcomeGuest = $("#welcomeGuest");
const seatMessage = $("#seatMessage");
const seatCount = $("#seatCount");
const plusOneNote = $("#plusOneNote");

const attendingFields =
  $("#attendingFields");

const formMessage =
  $("#formMessage");

const changeGuest =
  $("#changeGuest");

const success =
  $("#rsvpSuccess");

const editResponse =
  $("#editResponse");

let activeGuest = null;


// ------------------------------------------------------------
// NORMALIZE NAME
// ------------------------------------------------------------
function normalizeName(name) {

  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

}


// ------------------------------------------------------------
// FIND INVITATION
// ------------------------------------------------------------
function getLocalGuest(key) {
  const match = Object.entries(guestList).find(([guestName]) => normalizeName(guestName) === key);

  if (!match) {
    return null;
  }

  const [name, details] = match;

  return {
    id: `local-${normalizeName(name)}`,
    name: details.displayName,
    seats: details.seats
  };
}

async function lookupGuest() {

  const key =
    normalizeName(
      guestNameInput.value
    );

  lookupMessage.textContent = "";


  // Empty field
  if (!key) {

    lookupMessage.textContent =
      "Please enter the full name on your invitation.";

    guestNameInput.focus();

    return;

  }


  const buttonLabel = findInvitation.textContent;
  findInvitation.disabled = true;
  findInvitation.textContent = "Checking...";

  let guest = null;
  let lookupError = null;

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("Guest")
        .select("id, name, seats")
        .ilike("name", key)
        .maybeSingle();

      guest = data;
      lookupError = error;
    } catch (error) {
      lookupError = error;
    }
  }

  if (!guest && !lookupError) {
    guest = getLocalGuest(key);
  }

  findInvitation.disabled = false;
  findInvitation.textContent = buttonLabel;

  if (lookupError) {
    lookupMessage.textContent = "We couldn't connect to the guest list. Please try again.";
    console.error(lookupError);
    return;
  }


  // Guest not found
  if (!guest) {

    lookupMessage.textContent =
      "We couldn't find that name on the guest list. Please check the spelling or contact the couple.";

    return;

  }


  // Save guest
  activeGuest = {
    key,
    displayName: guest.name,
    seats: guest.seats,
    id: guest.id
  };


  // Display guest information
  welcomeGuest.textContent =
    `Welcome, ${guest.name}`;


  seatMessage.textContent =
    `${guest.seats} ${
      guest.seats === 1
        ? "seat"
        : "seats"
    } reserved in your name.`;


  seatCount.textContent =
    `${guest.seats} ${
      guest.seats === 1
        ? "Seat"
        : "Seats"
    }`;


  // Plus-one message
  if (guest.seats === 1) {

    plusOneNote.textContent =
      "As we are celebrating with those closest to us, additional guests cannot be added unless specifically included on your invitation.";

  } else {

    plusOneNote.textContent =
      `Your invitation includes ${guest.seats} reserved seats. Additional guests cannot be added.`;

  }


  // Move to RSVP form
  lookupStep.classList.remove(
    "active"
  );

  responseStep.classList.add(
    "active"
  );

}


// ------------------------------------------------------------
// FIND INVITATION BUTTON
// ------------------------------------------------------------
findInvitation.addEventListener(
  "click",
  lookupGuest
);


// ------------------------------------------------------------
// ENTER KEY FOR GUEST SEARCH
// ------------------------------------------------------------
guestNameInput.addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {

      event.preventDefault();

      lookupGuest();

    }

  }
);


// ------------------------------------------------------------
// ATTENDANCE SELECTION
// ------------------------------------------------------------
$$("input[name='attendance']")
  .forEach(radio => {

    radio.addEventListener(
      "change",
      () => {

        const showFields =
          radio.value === "accepts" &&
          radio.checked;


        attendingFields.classList.toggle(
          "show",
          showFields
        );


        formMessage.textContent = "";

      }
    );

  });


// ------------------------------------------------------------
// CHANGE GUEST
// ------------------------------------------------------------
changeGuest.addEventListener(
  "click",
  () => {

    activeGuest = null;

    responseStep.classList.remove(
      "active"
    );

    lookupStep.classList.add(
      "active"
    );

    attendingFields.classList.remove(
      "show"
    );

    form.reset();

    formMessage.textContent = "";

    lookupMessage.textContent = "";

    guestNameInput.focus();

  }
);


// ------------------------------------------------------------
// SUBMIT RSVP
// ------------------------------------------------------------
form.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    formMessage.textContent = "";


    // Guest verification
    if (!activeGuest) {

      formMessage.textContent =
        "Please find your invitation first.";

      return;

    }


    // Attendance
    const attendance =
      $("input[name='attendance']:checked");


    if (!attendance) {

      formMessage.textContent =
        "Please let us know whether you will be joining us.";

      return;

    }


    // Meal preference
    if (
      attendance.value === "accepts" &&
      !$("input[name='meal']:checked")
    ) {

      formMessage.textContent =
        "Please select a meal preference.";

      return;

    }


    // RSVP data
    const response = {

      guest:
        activeGuest.displayName,

      seats:
        activeGuest.seats,

      attendance:
        attendance.value,

      meal:
        $("input[name='meal']:checked")
          ?.value || "N/A",

      requests:
        $("#requests")
          .value
          .trim(),

      submittedAt:
        new Date().toISOString()

    };


    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";

    let submissionError = null;
    const shouldUseLocalFallback =
      !supabaseClient ||
      typeof activeGuest.id === "string" && activeGuest.id.startsWith("local-") ||
      typeof activeGuest.id !== "number" && typeof activeGuest.id !== "string";

    if (shouldUseLocalFallback) {
      try {
        const savedResponses = JSON.parse(localStorage.getItem(RSVP_STORAGE_KEY) || "[]");
        savedResponses.push({
          ...response,
          guest_id: activeGuest.id,
          storedLocally: true
        });
        localStorage.setItem(RSVP_STORAGE_KEY, JSON.stringify(savedResponses));
      } catch (error) {
        submissionError = error;
      }
    } else {
      try {
        const { error } = await supabaseClient
          .from("rsvps")
          .insert({
            guest_id: activeGuest.id,
            attendance: response.attendance,
            meal: response.meal,
            requests: response.requests
          });

        submissionError = error;
      } catch (error) {
        submissionError = error;
      }
    }

    submitButton.disabled = false;
    submitButton.textContent = "Submit RSVP";

    if (submissionError) {
      formMessage.textContent = "We couldn't save your RSVP. Please try again.";
      console.error(submissionError);
      return;
    }

    form.style.display = "none";
    success.classList.add("show");

    const rsvpCard = success.closest(".rsvp-card");
    rsvpCard?.scrollIntoView({ behavior: "auto", block: "center" });

    if (rsvpCard) {
      const cardRect = rsvpCard.getBoundingClientRect();
      const cardOffset =
        (cardRect.top + cardRect.bottom) / 2 - window.innerHeight / 2;

      const previousScrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollBy(0, cardOffset);
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
    }

  }
);


// ------------------------------------------------------------
// EDIT RSVP
// ------------------------------------------------------------
editResponse.addEventListener(
  "click",
  () => {

    success.classList.remove(
      "show"
    );

    form.style.display = "block";

    responseStep.classList.add(
      "active"
    );

  }
);
