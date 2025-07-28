---js
const eleventyNavigation = {
    key: "About",
    order: 3
};
---

# About

Nightdogs are hotdogs that you eat in the middle of the night

## Authors

<div class="h-card" data-author="jane" id="jane">
    <h3 class="p-name">{{ authors.jane.name }}</h3>
    <p class="p-bio">{{ authors.jane.bio | safe }}</p>
    <p class="p-note">{{ authors.jane.note | safe }}</p>
    <ul>
        {% for link in authors.jane.links %}
        <li><a href="{{ link.url }}" {% if link.rel %}rel="{{ link.rel }}"{% endif %} {% if link.class %}class="{{ link.class }}"{% endif %} {% if link.target %}target="{{ link.target }}"{% endif %}>{{ link.label }}</a></li>
        {% endfor %}
    </ul>
</div>

<div class="h-card" data-author="abby" id="abby">
    <h3 class="p-name">{{ authors.abby.name }}</h3>
    <p class="p-bio">{{ authors.abby.bio | safe }}</p>
    <p class="p-note">{{ authors.abby.note | safe }}</p>
    <ul>
        {% for link in authors.abby.links %}
        <li><a href="{{ link.url }}" {% if link.rel %}rel="{{ link.rel }}"{% endif %} {% if link.class %}class="{{ link.class }}"{% endif %} {% if link.target %}target="{{ link.target }}"{% endif %}>{{ link.label }}</a></li>
        {% endfor %}
    </ul>
</div>

<div class="h-card" data-author="adesse" id="adesse">
    <h3 class="p-name">{{ authors.adesse.name }}</h3>
    <p class="p-bio">{{ authors.adesse.bio | safe }}</p>
    <p class="p-note">{{ authors.adesse.note | safe }}</p>
    <ul>
        {% for link in authors.adesse.links %}
        <li><a href="{{ link.url }}" {% if link.rel %}rel="{{ link.rel }}"{% endif %} {% if link.class %}class="{{ link.class }}"{% endif %} {% if link.target %}target="{{ link.target }}"{% endif %}>{{ link.label }}</a></li>
        {% endfor %}
    </ul>
</div>

<div class="h-card" data-author="orionlw" id="orionlw">
    <h3 class="p-name">{{ authors.orionlw.name }}</h3>
    <p class="p-bio">{{ authors.orionlw.bio | safe }}</p>
    <p class="p-note">{{ authors.orionlw.note | safe }}</p>
    <ul>
        {% for link in authors.orionlw.links %}
        <li><a href="{{ link.url }}" {% if link.rel %}rel="{{ link.rel }}"{% endif %} {% if link.class %}class="{{ link.class }}"{% endif %} {% if link.target %}target="{{ link.target }}"{% endif %}>{{ link.label }}</a></li>
        {% endfor %}
    </ul>
</div>

<div class="h-card" data-author="amelia" id="amelia">
    <h3 class="p-name">{{ authors.amelia.name }}</h3>
    <p class="p-bio">{{ authors.amelia.bio | safe }}</p>
    <p class="p-note">{{ authors.amelia.note | safe }}</p>
    <ul>
        {% for link in authors.amelia.links %}
        <li><a href="{{ link.url }}" {% if link.rel %}rel="{{ link.rel }}"{% endif %} {% if link.class %}class="{{ link.class }}"{% endif %} {% if link.target %}target="{{ link.target }}"{% endif %}>{{ link.label }}</a></li>
        {% endfor %}
    </ul>
</div>

<div class="h-card" data-author="nic" id="nic">
    <h3 class="p-name">{{ authors.nic.name }}</h3>
    <p class="p-bio">{{ authors.nic.bio | safe }}</p>
    <p class="p-note">{{ authors.nic.note | safe }}</p>
    <ul>
        {% for link in authors.nic.links %}
        <li><a href="{{ link.url }}" {% if link.rel %}rel="{{ link.rel }}"{% endif %} {% if link.class %}class="{{ link.class }}"{% endif %} {% if link.target %}target="{{ link.target }}"{% endif %}>{{ link.label }}</a></li>
        {% endfor %}
    </ul>
</div>
